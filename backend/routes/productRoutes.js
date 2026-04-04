import express from 'express';
const router = express.Router();
import Product from '../models/Product.js';
import { protect, shopkeeperAndAbove, employeeAndAbove } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

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
            console.error("=== UPLOAD ERROR IN POST ===", err);
            return res.status(400).json({ message: err.message || "Failed to upload images to Cloudinary" });
        }

        // 4. If we get here, the upload succeeded. Now we do the database logic.
        try {
            console.log("=== HIT POST /product ===");
            console.log("req.body:", req.body);
            console.log("req.files:", req.files);

            const { name, description, price, category, stock, tags } = req.body;
            
            const imageUrls = req.files ? req.files.map(file => file.path) : [];
            const parsedTags = tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

            const product = await Product.create({
                name,
                description,
                price: Number(price),
                category,
                images: imageUrls,
                stock: Number(stock) || 0,
                tags: parsedTags,
                createdBy: req.user._id,
            });
            res.status(201).json(product);
        } catch (error) {
            console.error("=== DB ERROR IN POST /product ===", error);
            res.status(400).json({ message: error.message || 'Error creating product' });
        }
    });
});

router.put('/:id', protect, employeeAndAbove, async (req, res) => {
    const uploadMiddleware = upload.array('images', 5);
    uploadMiddleware(req, res, async (err) => {
        // 3. Catch Multer/Cloudinary errors IMMEDIATELY
        if (err) {
            console.error("=== UPLOAD ERROR IN POST ===", err);
            return res.status(400).json({ message: err.message || "Failed to upload images to Cloudinary" });
        }
        try {
            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ message: 'Product not found' });

            const { name, description, price, category, stock, tags, existingImages } = req.body;

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