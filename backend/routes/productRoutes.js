import express from 'express';
const router = express.Router();
import Product from '../models/Product.js';

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({});
        // In a real app, you'd add pagination here
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

// In a real app, you would have protected routes for admins to:
// CREATE a product (POST /api/products)
// UPDATE a product (PUT /api/products/:id)
// DELETE a product (DELETE /api/products/:id)

export default router;