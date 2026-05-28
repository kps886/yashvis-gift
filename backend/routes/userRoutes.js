import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, adminOnly, shopkeeperAndAbove } from '../middleware/authMiddleware.js';
import crypto from 'crypto';
import { sendPasswordResetEmail, sendEmail } from '../utils/emailService.js';

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

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        try {
            await sendEmail({
                to: user.email,
                subject: 'Verify your MonikaCreation Account',
                html: `
                    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                        <h2>Welcome to MonikaCreation!</h2>
                        <p>Your verification code is:</p>
                        <h1 style="color: #d4af37; letter-spacing: 5px;">${otp}</h1>
                        <p>This code will expire in 10 minutes.</p>
                    </div>
                `,
            });
        } catch (error) {
            console.error("Email failed to send:", error);
        }

        res.status(201).json({
            success: true,
            requiresVerification: true,
            email: user.email,
            message: 'Registration successful. Please verify your email.'
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

        if (!user.isVerified) {
            return res.status(403).json({ 
                message: 'Please verify your email before logging in.',
                requiresVerification: true,
                email: user.email 
            });
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

// @desc    Resend OTP
// @route   POST /api/users/resend-otp
// @access  Public
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Account is already verified' });

        // Check our strict 3-time limit
        if (user.otpResendCount >= 3) {
            return res.status(429).json({ message: 'Maximum OTP resend limit reached. Please contact support.' });
        }

        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = otp;
        user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 mins
        user.otpResendCount += 1; // Increment the counter!
        await user.save();

        // Send Email
        try {
            await sendEmail({
                to: user.email,
                subject: 'Your New Verification Code',
                html: `
                    <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px;">
                        <h2>MonikaCreation</h2>
                        <p>Here is your new verification code:</p>
                        <h1 style="color: #d4af37; letter-spacing: 5px;">${otp}</h1>
                        <p>This code will expire in 10 minutes.</p>
                    </div>
                `,
            });
        } catch (error) {
            console.error("Email failed to send:", error);
        }

        // Return the number of attempts left to the frontend
        res.json({ message: 'OTP resent successfully', attemptsLeft: 3 - user.otpResendCount });
    } catch (error) {
        res.status(500).json({ message: 'Server error during OTP resend' });
    }
});

// @desc    Verify OTP
// @route   POST /api/users/verify-otp
// @access  Public
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isVerified) return res.status(400).json({ message: 'Account is already verified' });

        if (user.otp !== otp || user.otpExpire < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Success! Verify user and clear OTP
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpire = undefined;
        user.unverifiedExpireAt = undefined;
        await user.save();

        // Log them in
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during verification' });
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

// @desc    Forgot Password
// @route   POST /api/users/forgotpassword
// @access  Public
router.post('/forgotpassword', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Please provide an email address' });

    try {
        const user = await User.findOne({ email });
        if (!user) {
            // Return 200 even if user doesn't exist for security (prevents email enumeration)
            return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
        }

        // Get reset token (generates and hashes it, but doesn't save to DB yet)
        const resetToken = user.getResetPasswordToken();
        await user.save({ validateBeforeSave: false });

        // Create reset URL (pointing to your React frontend)
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

        try {
            await sendPasswordResetEmail(user.email, user.name, resetUrl);
            res.status(200).json({ message: 'Email sent' });
        } catch (err) {
            // If email fails, clear the token from DB so they can try again
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            await user.save({ validateBeforeSave: false });
            return res.status(500).json({ message: 'Email could not be sent' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @desc    Reset Password
// @route   PUT /api/users/resetpassword/:token
// @access  Public
router.put('/resetpassword/:token', async (req, res) => {
    try {
        // Hash the token from the URL to compare it with the hashed token in DB
        const resetPasswordToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // Find user by token AND ensure token hasn't expired
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

        if (!req.body.password || req.body.password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Set new password (the pre-save hook in User.js will hash it)
        user.password = req.body.password;
        
        // Clear reset token fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful. Please log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

export default router;
