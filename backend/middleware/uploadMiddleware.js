import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

console.log("=== CLOUDINARY CONFIG CHECK ===");
console.log("- Cloud Name present:", !!process.env.CLOUDINARY_CLOUD_NAME);
console.log("- API Key present:", !!process.env.CLOUDINARY_API_KEY);
console.log("- API Secret present:", !!process.env.CLOUDINARY_API_SECRET);
console.log("===============================");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'charming_products',
        allowed_formats: ['*'],
    }
});

const upload = multer({ storage });

export default upload;