import express from 'express';
import PromoCode from '../models/PromoCode.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/promo/validate
// Validates a promo code against a subtotal.
// Called from the checkout page.
// ─────────────────────────────────────────────
router.post('/validate', protect, async (req, res) => {
    const { code, subtotal } = req.body;

    if (!code || !subtotal) {
        return res.status(400).json({ message: 'Code and subtotal are required' });
    }

    try {
        const promo = await PromoCode.findOne({ code: code.toUpperCase() });

        if (!promo)        return res.status(404).json({ message: 'Invalid promo code' });
        if (!promo.isActive) return res.status(400).json({ message: 'This promo code is no longer active' });
        if (promo.expiresAt && promo.expiresAt < new Date())
            return res.status(400).json({ message: 'This promo code has expired' });
        if (promo.usageLimit !== null && promo.usedCount >= promo.usageLimit)
            return res.status(400).json({ message: 'Promo code usage limit reached' });
        if (subtotal < promo.minOrderValue)
            return res.status(400).json({ message: `Minimum order value ₹${promo.minOrderValue} required` });

        const discount = Math.round(promo.calcDiscount(subtotal));

        res.json({
            valid:         true,
            code:          promo.code,
            discountType:  promo.discountType,
            discountValue: promo.discountValue,
            discount,       // actual ₹ amount off
            message:       promo.discountType === 'flat'
                ? `₹${discount} off applied!`
                : `${promo.discountValue}% off — ₹${discount} saved!`,
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ─────────────────────────────────────────────
// Admin CRUD for promo codes
// ─────────────────────────────────────────────

// GET all promo codes
router.get('/', protect, adminOnly, async (req, res) => {
    const promos = await PromoCode.find({}).sort({ createdAt: -1 });
    res.json(promos);
});

// Create promo code
router.post('/', protect, adminOnly, async (req, res) => {
    try {
        const promo = await PromoCode.create({ ...req.body, code: req.body.code.toUpperCase() });
        res.status(201).json(promo);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Error creating promo code' });
    }
});

// Update promo code
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const promo = await PromoCode.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!promo) return res.status(404).json({ message: 'Promo code not found' });
        res.json(promo);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Error updating promo code' });
    }
});

// Delete promo code
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const promo = await PromoCode.findByIdAndDelete(req.params.id);
        if (!promo) return res.status(404).json({ message: 'Promo code not found' });
        res.json({ message: 'Promo code deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;