import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verify JWT and attach user to request
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user || !req.user.isActive) {
                return res.status(401).json({ message: 'Account inactive or not found' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Role hierarchy map (higher number = more authority)
const ROLE_LEVELS = {
    user: 1,
    employee: 2,
    shopkeeper: 3,
    admin: 4,
};

// Middleware factory: allow roles at or above a minimum level
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
            });
        }
        next();
    };
};

// Shorthand middlewares
export const adminOnly = authorize('admin');
export const shopkeeperAndAbove = authorize('admin', 'shopkeeper');
export const employeeAndAbove = authorize('admin', 'shopkeeper', 'employee');
