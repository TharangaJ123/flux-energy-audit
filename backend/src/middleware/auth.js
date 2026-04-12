/**
 * @file auth.js
 * @description Authentication and authorization middleware.
 * Handles JWT verification and role-based access control.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/userManagement.model');

// Middleware to protect routes: verifies JWT token and attaches user to request
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error('JWT Verification Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    // Token was not provided in headers
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * @description Grant access to specific user roles
 * @param {...string} roles - List of allowed roles
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };

