import express from 'express';
const router = express.Router();
import Product from '../models/Product.js';
import { protect, shopkeeperAndAbove, employeeAndAbove } from '../middleware/authMiddleware.js';

// @desc    Fetch all products (with optional category filter)
// @route   GET /api/products
// @access  Public
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.category) {
            filter.category = req.query.category;
        }
        if (req.query.search) {
            filter.name = { $regex: req.query.search, $options: 'i' };
        }
        const products = await Product.find(filter).sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
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
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new product
// @route   POST /api/products
// @access  Private/Shopkeeper+
router.post('/', protect, shopkeeperAndAbove, async (req, res) => {
    const { name, description, price, category, images, stock, variations, tags } = req.body;

    try {
        const product = await Product.create({
            name,
            description,
            price,
            category,
            images: images || [],
            stock: stock || 0,
            variations: variations || [],
            tags: tags || [],
            createdBy: req.user._id,
        });
        res.status(201).json(product);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Error creating product' });
    }
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Employee+
router.put('/:id', protect, employeeAndAbove, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const { name, description, price, category, images, stock, variations, tags } = req.body;
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (category !== undefined) product.category = category;
        if (images !== undefined) product.images = images;
        if (stock !== undefined) product.stock = stock;
        if (variations !== undefined) product.variations = variations;
        if (tags !== undefined) product.tags = tags;

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: error.message || 'Error updating product' });
    }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Shopkeeper+
router.delete('/:id', protect, shopkeeperAndAbove, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        await Product.deleteOne({ _id: req.params.id });
        res.json({ message: 'Product removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Add a review to a product
// @route   POST /api/products/:id/reviews
// @access  Private (all logged in users)
router.post('/:id/reviews', protect, async (req, res) => {
    const { rating, comment } = req.body;

    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const alreadyReviewed = product.reviews.find(
            (r) => r.user && r.user.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        const review = {
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment,
        };
        product.reviews.push(review);
        await product.save();
        res.status(201).json({ message: 'Review added' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
