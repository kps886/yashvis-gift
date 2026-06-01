import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import PromoCode from '../models/PromoCode.js';
import { protect, employeeAndAbove, shopkeeperAndAbove } from '../middleware/authMiddleware.js';
import User from '../models/User.js';
import { sendOrderConfirmation, sendStatusUpdate } from '../utils/emailService.js';

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ─────────────────────────────────────────────
// STEP A  →  Create Razorpay order
//            Frontend hits this before showing the payment button.
//            Returns a razorpayOrderId the frontend passes to Razorpay SDK.
// POST /api/orders/create-payment
// ─────────────────────────────────────────────
router.post('/create-payment', protect, async (req, res) => {
    const { items, shippingAddress, promoCode } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in order' });
    }
    if (!shippingAddress) {
        return res.status(400).json({ message: 'Shipping address is required' });
    }

    try {
        // 1. Verify each product and compute subtotal from DB prices (never trust frontend prices)
        let subtotal = 0;
        const verifiedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.product);
            if (!product) {
                return res.status(404).json({ message: `Product ${item.product} not found` });
            }
            if (product.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for "${product.name}"` });
            }
            subtotal += product.price * item.quantity;
            verifiedItems.push({
                product: product._id,
                name: product.name,
                image: product.images?.[0] || '',
                price: product.price,
                quantity: item.quantity,
                size: item.size || null,
            });
        }

        // 2. Delivery fee
        const deliveryFee = Order.calcDeliveryFee(subtotal);

        // 3. Promo code (optional)
        let discount = 0;
        let appliedPromo = null;

        if (promoCode) {
            const promo = await PromoCode.findOne({ code: promoCode.toUpperCase() });

            if (!promo) return res.status(400).json({ message: 'Invalid promo code' });
            if (!promo.isActive) return res.status(400).json({ message: 'This promo code is no longer active' });
            if (promo.expiresAt && promo.expiresAt < new Date()) return res.status(400).json({ message: 'This promo code has expired' });
            if (promo.usageLimit && promo.usedCount >= promo.usageLimit) return res.status(400).json({ message: 'Promo code usage limit reached' });
            if (subtotal < promo.minOrderValue) return res.status(400).json({ message: `Minimum order value ₹${promo.minOrderValue} required for this code` });

            discount = Math.round(promo.calcDiscount(subtotal));
            appliedPromo = promo.code;
        }

        // 4. Final total (never let total go below 1 rupee)
        const total = Math.max(subtotal + deliveryFee - discount, 1);

        // 5. Create Razorpay order (amount in paise)
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(total * 100),
            currency: 'INR',
            receipt: `rcpt_${Date.now()}`,
        });

        // 6. Save order to DB in 'pending' state
        const order = await Order.create({
            user: req.user._id,
            items: verifiedItems,
            shippingAddress,
            subtotal: Math.round(subtotal),
            deliveryFee,
            discount,
            total: Math.round(total),
            promoCode: appliedPromo,
            promoDiscount: discount,
            razorpayOrderId: razorpayOrder.id,
            paymentStatus: 'pending',
            orderStatus: 'pending',
        });

        res.status(201).json({
            orderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,   // in paise
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            // Summary for the checkout page
            subtotal,
            deliveryFee,
            discount,
            total: Math.round(total),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating payment order' });
    }
});

// ─────────────────────────────────────────────
// STEP B  →  Verify payment after Razorpay callback
//            Frontend sends the three IDs Razorpay returns.
//            We verify the signature — this is the security step.
// POST /api/orders/verify-payment
// ─────────────────────────────────────────────
router.post('/verify-payment', protect, async (req, res) => {
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    try {
        // 1. Verify HMAC signature
        const body = razorpayOrderId + '|' + razorpayPaymentId;
        const expected = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expected !== razorpaySignature) {
            return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
        }

        // 2. Find and update our order
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.paymentStatus = 'paid';
        order.orderStatus = 'processing';
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        order.paidAt = new Date();
        await order.save();
        const buyer = await User.findById(order.user).select('name email');
        if (buyer) {
            await sendOrderConfirmation(order, buyer.email, buyer.name);
        }

        // 3. Deduct stock for each item
        for (const item of order.items) {
            const updatedProduct = await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
            }, { new: true });

            if (updatedProduct && updatedProduct.stock <= 0) {
                const staffMembers = await User.find({ 
                    role: { $in: ['admin', 'shopkeeper'] } 
                }).select('email');
                
                const staffEmails = staffMembers.map(u => u.email);
                
                if (staffEmails.length > 0) {
                    await sendLowStockAlert(updatedProduct, staffEmails);
                }
            }
        }

        // 4. Increment promo code usage
        if (order.promoCode) {
            await PromoCode.findOneAndUpdate(
                { code: order.promoCode },
                { $inc: { usedCount: 1 } }
            );
        }

        res.json({ message: 'Payment verified', orderId: order._id, orderStatus: order.orderStatus });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error verifying payment' });
    }
});

// ─────────────────────────────────────────────
// GET /api/orders/my  →  current user's orders
// ─────────────────────────────────────────────
router.get('/my', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .populate('items.product', 'name images');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// ─────────────────────────────────────────────
// GET /api/orders/:id  →  single order (owner or staff)
// ─────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('items.product', 'name images');
        if (!order) return res.status(404).json({ message: 'Order not found' });

        const isOwner = order.user.toString() === req.user._id.toString();
        const isStaff = ['admin', 'shopkeeper', 'employee'].includes(req.user.role);
        if (!isOwner && !isStaff) return res.status(403).json({ message: 'Not authorized' });

        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching order' });
    }
});

// ─────────────────────────────────────────────
// GET /api/orders  →  all orders (staff only)
// ─────────────────────────────────────────────
router.get('/', protect, employeeAndAbove, async (req, res) => {
    try {
        const orders = await Order.find({})
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product', 'name');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
});

// ─────────────────────────────────────────────
// PUT /api/orders/:id/status  →  update order status
// ─────────────────────────────────────────────
router.put('/:id/status', protect, employeeAndAbove, async (req, res) => {
    const { orderStatus, trackingNumber } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(orderStatus)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.orderStatus = orderStatus;
        if (trackingNumber) order.trackingNumber = trackingNumber;
        if (orderStatus === 'delivered') order.deliveredAt = new Date();
        if (orderStatus === 'cancelled') {
            order.cancelledAt = new Date();
            order.cancelReason = req.body.cancelReason || null;
        }

        await order.save();
        const buyer = await User.findById(order.user).select('name email');
        if (buyer) {
            await sendStatusUpdate(order, buyer.email, buyer.name);
        }
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: 'Error updating order status' });
    }
});

// @desc    Cancel an order (User initiated)
// @route   PUT /api/orders/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // 1. Security Check: Does this order actually belong to the person requesting the cancel?
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized to modify this order' });
        }

        // 2. Logic Check: We ONLY cancel if it hasn't been processed yet
        if (order.orderStatus !== 'pending') {
            return res.status(400).json({ 
                message: `You cannot cancel an order that is already ${order.orderStatus}. Please contact support.` 
            });
        }

        // 3. Update status
        order.orderStatus = 'cancelled';
        await order.save();

        res.json({ message: 'Order cancelled successfully', order });
    } catch (error) {
        res.status(500).json({ message: 'Server error cancelling order' });
    }
});

export default router;