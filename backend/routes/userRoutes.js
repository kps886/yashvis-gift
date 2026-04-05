import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, adminOnly, shopkeeperAndAbove } from '../middleware/authMiddleware.js';

const router = express.Router();

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// @desc    Register a new user (public - always registers as 'user' role)
// @route   POST /api/users/register
// @access  Public
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Please provide name, email and password' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({ name, email, password, role: 'user' });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private (all authenticated users)
router.get('/profile', protect, async (req, res) => {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// @desc    Update current user profile
// @route   PUT /api/users/profile
// @access  Private (all authenticated users)
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        if (req.body.password) {
            user.password = req.body.password; // pre-save hook will hash it
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            token: generateToken(updatedUser._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating profile' });
    }
});

// ── Wishlist ──────────────────────────────────────────────────

// @desc    Get current user's wishlist
// @route   GET /api/users/wishlist
// @access  Private
router.get('/wishlist', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('wishlist', 'name price images stock tags category');
        res.json(user.wishlist || []);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching wishlist' });
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// @desc    Create a user with a specific role (admin, shopkeeper, employee)
// @route   POST /api/users/create
// @access  Private/Admin
router.post('/create', protect, adminOnly, async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide name, email, password and role' });
    }

    const validRoles = ['admin', 'shopkeeper', 'employee', 'user'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const user = await User.create({ name, email, password, role });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error creating user' });
    }
});

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
router.get('/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Update any user's role/status (admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
router.put('/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;
        if (typeof req.body.isActive === 'boolean') user.isActive = req.body.isActive;

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            isActive: updatedUser.isActive,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error updating user' });
    }
});

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Prevent admin from deleting themselves
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await User.deleteOne({ _id: req.params.id });
        res.json({ message: 'User removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting user' });
    }
});

// ── Address management ────────────────────────────────────────

// @desc    Add a new address
// @route   POST /api/users/addresses
// @access  Private
router.post('/addresses', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { fullName, phone, line1, line2, city, state, pincode, country, isDefault } = req.body;

        // If new address is default, unset all others
        if (isDefault) {
            user.addresses.forEach(a => { a.isDefault = false; });
        }

        // If it's the first address, make it default automatically
        const makeDefault = isDefault || user.addresses.length === 0;

        user.addresses.push({ fullName, phone, line1, line2, city, state, pincode, country, isDefault: makeDefault });
        await user.save();

        res.status(201).json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: 'Error adding address' });
    }
});

// @desc    Set an address as default
// @route   PUT /api/users/addresses/:addressId/default
// @access  Private
router.put('/addresses/:addressId/default', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.addresses.forEach(a => {
            a.isDefault = a._id.toString() === req.params.addressId;
        });
        await user.save();

        res.json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: 'Error updating address' });
    }
});

// @desc    Delete an address
// @route   DELETE /api/users/addresses/:addressId
// @access  Private
router.delete('/addresses/:addressId', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const idx = user.addresses.findIndex(a => a._id.toString() === req.params.addressId);
        if (idx === -1) return res.status(404).json({ message: 'Address not found' });

        const wasDefault = user.addresses[idx].isDefault;
        user.addresses.splice(idx, 1);

        // If deleted address was default, make first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        res.json(user.addresses);
    } catch (err) {
        res.status(500).json({ message: 'Error deleting address' });
    }
});



// @desc    Toggle product in wishlist (add if absent, remove if present)
// @route   POST /api/users/wishlist/:productId
// @access  Private
router.post('/wishlist/:productId', protect, async (req, res) => {
    try {
        const user      = await User.findById(req.user._id);
        const productId = req.params.productId;
        const idx       = user.wishlist.findIndex(id => id.toString() === productId);

        if (idx === -1) {
            user.wishlist.push(productId);
        } else {
            user.wishlist.splice(idx, 1);
        }

        await user.save();
        res.json({ wishlisted: idx === -1, wishlist: user.wishlist });
    } catch (err) {
        res.status(500).json({ message: 'Error updating wishlist' });
    }
});


export default router;
