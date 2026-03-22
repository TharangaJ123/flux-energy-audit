/**
 * User Validation - Joi schemas for request validation
 */
const Joi = require('joi');

// Schema for user registration
const registerUser = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

// Schema for user login
const loginUser = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
});

// Schema for updating user profile
const updateUser = Joi.object({
    name: Joi.string(),
    email: Joi.string().email(),
    password: Joi.string().min(6),
});

module.exports = {
    registerUser,
    loginUser,
    updateUser,
};
