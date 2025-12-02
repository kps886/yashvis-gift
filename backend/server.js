import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // To parse JSON bodies

// --- Database Connection ---
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB(); // Connect to the database

// --- API Routes ---
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Use the product routes
app.use('/api/products', productRoutes);

// TODO: Add User authentication routes (login, register)
// app.use('/api/users', userRoutes);

// TODO: Add Order processing routes
// app.use('/api/orders', orderRoutes);

// TODO: Add Payment gateway route (e.g., for Razorpay)
// This route would create a payment order on Razorpay and return the order ID
// app.post('/api/payment/create', ...);

// --- Server Initialization ---
const PORT = process.env.PORT || 5001;
app.listen(PORT, console.log(`Server running on port ${PORT}`));