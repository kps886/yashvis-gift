import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    discountType: {
        type: String,
        enum: ['flat', 'percent'],   // flat = ₹X off, percent = X% off
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
        min: 1,
    },
    // Percent discounts can have a max cap (e.g. 20% but not more than ₹200)
    maxDiscountAmount: {
        type: Number,
        default: null,
    },
    // Minimum cart value needed to use this code
    minOrderValue: {
        type: Number,
        default: 0,
    },
    isActive: { type: Boolean, default: true },

    // Optional expiry
    expiresAt: { type: Date, default: null },

    // Usage limits
    usageLimit: { type: Number, default: null },  // null = unlimited
    usedCount:  { type: Number, default: 0 },
}, { timestamps: true });

// ── Instance method: calculate discount for a given subtotal ──
promoCodeSchema.methods.calcDiscount = function (subtotal) {
    if (this.discountType === 'flat') {
        return this.discountValue;
    }
    // percent
    const raw = (subtotal * this.discountValue) / 100;
    return this.maxDiscountAmount ? Math.min(raw, this.maxDiscountAmount) : raw;
};

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode;