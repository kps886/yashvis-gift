import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const addressSchema = new mongoose.Schema({
    fullName:  { type: String, required: true },
    phone:     { type: String, required: true },
    line1:     { type: String, required: true },
    line2:     { type: String, default: '' },
    city:      { type: String, required: true },
    state:     { type: String, required: true },
    pincode:   { type: String, required: true },
    country:   { type: String, default: 'India' },
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
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        default: null,
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;