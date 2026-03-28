import mongoose from 'mongoose';

const variationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    options: [{ type: String, required: true }]
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
        type: String,
        required: true
    }],
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    variations: [variationSchema],
    tags: [String],
    reviews: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        rating: Number,
        comment: String,
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);
export default Product;
