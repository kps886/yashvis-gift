import mongoose from 'mongoose';

const DELIVERY_FEE_THRESHOLD = 500;  // free shipping above this
const FLAT_DELIVERY_FEE      = 50;   // fee when below threshold

const orderItemSchema = new mongoose.Schema({
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name:     { type: String, required: true },
    image:    { type: String },
    price:    { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [orderItemSchema],

    shippingAddress: {
        fullName: { type: String, required: true },
        phone:    { type: String, required: true },
        line1:    { type: String, required: true },
        line2:    { type: String, default: '' },
        city:     { type: String, required: true },
        state:    { type: String, required: true },
        pincode:  { type: String, required: true },
        country:  { type: String, default: 'India' },
    },

    // Pricing breakdown (all in ₹)
    subtotal:    { type: Number, required: true },   // sum of item prices
    deliveryFee: { type: Number, required: true },   // 50 or 0
    discount:    { type: Number, default: 0 },       // from promo code
    total:       { type: Number, required: true },   // subtotal + deliveryFee - discount

    promoCode:     { type: String, default: null },
    promoDiscount: { type: Number, default: 0 },

    paymentMethod: {
        type: String,
        enum: ['razorpay'],
        default: 'razorpay',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending',
    },
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },
    razorpaySignature: { type: String, default: null },
    paidAt:            { type: Date, default: null },

    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    trackingNumber: { type: String, default: null },
    deliveredAt:    { type: Date, default: null },
    cancelledAt:    { type: Date, default: null },
    cancelReason:   { type: String, default: null },
}, { timestamps: true });

orderSchema.statics.calcDeliveryFee = function (subtotal) {
    return subtotal >= DELIVERY_FEE_THRESHOLD ? 0 : FLAT_DELIVERY_FEE;
};

const Order = mongoose.model('Order', orderSchema);
export default Order;