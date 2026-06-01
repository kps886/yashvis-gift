import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
// import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import promoRoutes from './routes/promoRoutes.js';
import analyticRoutes from './routes/analyticsRoutes.js';
import cartRoutes from './routes/cartRoutes.js';

dotenv.config();

const app = express();

app.use(helmet())
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
}));
// app.use(mongoSanitize());
app.set('trust proxy', 1);
const apiLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 100, 
    message: { message: 'Too many requests from this IP, please try again after 10 minutes.' }
});

// Strict Rate Limiting for Auth routes (Login/Register/OTP): Max 10 attempts per 10 mins
const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    message: { message: 'Too many login attempts. Please try again later.' }
});
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'API is running...', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/users', authLimiter, userRoutes); // Protect auth strictly
app.use('/api/products', apiLimiter, productRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/promo', apiLimiter, promoRoutes);
app.use('/api/analytics', apiLimiter, analyticRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);


// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
