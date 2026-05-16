/**
 * Run this ONCE to create your first admin user:
 *   node seed.js
 *
 * Change the credentials below before running!
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            console.log('An admin user already exists:', adminExists.email);
            process.exit(0);
        }

        const admin = await User.create({
            name: 'Admin',
            email: 'admin@monikaCreation.com',
            password: 'admin123456',   // Change this!
            role: 'admin',
        });

        console.log('✅ Admin user created successfully!');
        console.log(`   Email:    ${admin.email}`);
        console.log(`   Password: admin123456  ← CHANGE THIS IN PRODUCTION`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin:', error.message);
        process.exit(1);
    }
};

seedAdmin();
