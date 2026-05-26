import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Cart from '../models/Cart.js';

const router = express.Router();

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product'); // Fetches name, price, images, etc.
        
        if (!cart) {
            cart = await Cart.create({ user: req.user._id, items: [] });
            return res.json([]);
        }

        // Filter out items where the product might have been deleted from the database
        const validItems = cart.items.filter(item => item.product != null);
        
        res.json(validItems);
    } catch (error) {
        console.error("Cart GET Error:", error);
        res.status(500).json({ message: 'Server Error fetching cart' });
    }
});

// @desc    Update entire cart
// @route   POST /api/cart
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { items } = req.body;

        // findOneAndUpdate is an ATOMIC operation.
        // It updates the database directly without fetching it first,
        // which completely eliminates the Mongoose VersionError collision!
        const cart = await Cart.findOneAndUpdate(
            { user: req.user._id },
            { $set: { items: items } },
            { 
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        res.json({ success: true, message: 'Cart synced' });
    } catch (error) {
        console.error("Cart POST Error:", error);
        res.status(500).json({ message: 'Server Error updating cart' });
    }
});

export default router;