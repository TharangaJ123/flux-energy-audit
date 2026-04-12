/**
 * @file userManagement.model.js
 * @description Mongoose schema and model for application users.
 * Passwords are stored as bcrypt hashes by the service layer before persistence.
 * The `role` field enables role-based access control via the `authorize` middleware.
 */
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    /** User's display name, trimmed of surrounding whitespace. */
    name: {
        type: String,
        required: true,
        trim: true,
    },
    /** Unique, case-insensitive email address used for authentication. */
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    /** bcrypt-hashed password — never returned in API responses (stripped by `protect` middleware). */
    password: {
        type: String,
        required: true,
    },
    /** Application role: `'user'` (default) or `'admin'`. Controls route-level access. */
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
}, {
    /** Automatically manage `createdAt` and `updatedAt` timestamps. */
    timestamps: true,
});

/** Export the compiled Mongoose model. */
module.exports = mongoose.model('User', userSchema);
