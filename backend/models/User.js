import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
        // In a real app, this should be hashed before saving!
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false,
    },
    // You could add fields for Google/Facebook IDs for social login
    // googleId: String,
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;