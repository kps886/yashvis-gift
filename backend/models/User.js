import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const addressSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
    isDefault: { type: Boolean, default: false },
}, { _id: true });

const userSchema = new mongoose.Schema({
    name: {
        type: String, required: true, trim: true,
    },
    email: {
        type: String, required: true, unique: true, lowercase: true, trim: true,
    },
    password: {
        type: String, required: true, minlength: 6,
    },
    role: {
        type: String,
        enum: ['admin', 'shopkeeper', 'employee', 'user'],
        default: 'user',
    },
    addresses: [addressSchema],   // ← NEW
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: [],
    }],
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        default: null,
    },
    isActive: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    isVerified: { 
        type: Boolean, 
        default: false 
    },
    otp: { 
        type: String 
    },
    otpExpire: { 
        type: Date 
    },
    otpResendCount: {
        type: Number,
        default: 0
    },
    unverifiedExpireAt: {
        type: Date,
        default: () => Date.now() + 24 * 60 * 60 * 1000,
        expires: 0
    },
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');

    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

const User = mongoose.model('User', userSchema);
export default User;