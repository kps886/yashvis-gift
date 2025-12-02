import mongoose from 'mongoose';

// Schema for product variations (e.g., color, size)
const variationSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Color" or "Size"
    options: [{ type: String, required: true }] // e.g., ["Black", "Tan"] or ["50ml", "100ml"]
});

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Electronics', 'Fragrances', 'Bags & Purses', 'Toys & Games', 'Home & Kitchen']
    },
    images: [{
        type: String, // Array of image URLs
        required: true
    }],
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    variations: [variationSchema], // Array of variations
    tags: [String], // For badges like "New Arrival", "Bestseller"
    reviews: [{
        // This would be a more complex object in a real app
        user: String,
        rating: Number,
        comment: String,
    }],
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

const Product = mongoose.model('Product', productSchema);

export default Product;