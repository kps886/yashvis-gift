import express from 'express';
const router = express.Router();
import Product from '../models/Product.js';
import { protect, shopkeeperAndAbove, employeeAndAbove } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

// @desc    Fetch products with pagination, sorting, search, category filter
// @route   GET /api/products?page=1&limit=12&sort=newest&category=X&search=Y
// @access  Public
router.get('/', async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(48, parseInt(req.query.limit) || 12);
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (req.query.category) filter.category = req.query.category;
        if (req.query.search) {
            filter.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { description: { $regex: req.query.search, $options: 'i' } },
                { category: { $regex: req.query.search, $options: 'i' } },
                { tags: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        // Build sort
        const SORT_MAP = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            price_asc: { price: 1 },
            price_desc: { price: -1 },
            name_asc: { name: 1 },
            name_desc: { name: -1 },
        };
        const sort = SORT_MAP[req.query.sort] || SORT_MAP.newest;

        const [products, total] = await Promise.all([
            Product.find(filter).sort(sort).skip(skip).limit(limit),
            Product.countDocuments(filter),
        ]);

        res.json({
            products,
            page,
            pages: Math.ceil(total / limit),
            total,
            limit,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

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

router.post('/', protect, shopkeeperAndAbove, async (req, res) => {
    const uploadMiddleware = upload.array('images', 5);
    uploadMiddleware(req, res, async (err) => {
        // 3. Catch Multer/Cloudinary errors IMMEDIATELY
        if (err) {
            return res.status(400).json({ message: err.message || "Failed to upload images to Cloudinary" });
        }

        // 4. If we get here, the upload succeeded. Now we do the database logic.
        try {
            ;

            const { name, description, price, category, stock, tags, variations } = req.body;

            const imageUrls = req.files ? req.files.map(file => file.path) : [];
            const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
            const parsedVariations = variations ? JSON.parse(variations) : [];

            const product = await Product.create({
                name,
                description,
                price: Number(price),
                category,
                images: imageUrls,
                stock: Number(stock) || 0,
                tags: parsedTags,
                variations: parsedVariations,
                createdBy: req.user._id,
            });
            res.status(201).json(product);
        } catch (error) {
            res.status(400).json({ message: error.message || 'Error creating product' });
        }
    });
});

router.put('/:id', protect, employeeAndAbove, async (req, res) => {
    const uploadMiddleware = upload.array('images', 5);
    uploadMiddleware(req, res, async (err) => {
        // 3. Catch Multer/Cloudinary errors IMMEDIATELY
        if (err) {
            return res.status(400).json({ message: err.message || "Failed to upload images to Cloudinary" });
        }
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ message: 'Product not found' });

            const { name, description, price, category, stock, tags, existingImages, variations } = req.body;

            const newImageUrls = req.files ? req.files.map(file => file.path) : [];
            const parsedExistingImages = existingImages ? JSON.parse(existingImages) : [];

            const combinedImages = [...parsedExistingImages, ...newImageUrls];

            if (name !== undefined) product.name = name;
            if (description !== undefined) product.description = description;
            if (price !== undefined) product.price = Number(price);
            if (category !== undefined) product.category = category;
            if (stock !== undefined) product.stock = Number(stock);

            if (tags !== undefined) {
                product.tags = tags.split(',').map(tag => tag.trim()).filter(Boolean);
            }
            if (variations !== undefined) {
                product.variations = JSON.parse(variations); // <-- Update it
            }
            if (combinedImages.length > 0) {
                product.images = combinedImages;
            } else if (existingImages === "[]" && newImageUrls.length === 0) {
                product.images = [];
            }

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } catch (error) {
            res.status(400).json({ message: error.message || 'Error updating product' });
        }
    });
});

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

// @desc    Add a review
// @route   POST /api/products/:id/reviews
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!comment?.trim()) {
        return res.status(400).json({ message: 'Comment is required' });
    }

    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const alreadyReviewed = product.reviews.find(
            r => r.user && r.user.toString() === req.user._id.toString()
        );
        if (alreadyReviewed) {
            return res.status(400).json({ message: 'You have already reviewed this product' });
        }

        product.reviews.push({
            user: req.user._id,
            name: req.user.name,
            rating: Number(rating),
            comment: comment.trim(),
        });

        // Store avg rating and count on the product for easy access
        product.avgRating = product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length;
        product.reviewCount = product.reviews.length;

        await product.save();
        res.status(201).json({ message: 'Review added' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;