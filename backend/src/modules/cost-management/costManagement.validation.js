const Joi = require('joi');

// Validation schemas for electricity cost requests.

// Validate payload for creating a cost record.
const createCost = Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(1900).required(),
    electricityCost: Joi.number().min(0).required(),
    notes: Joi.string().allow('').optional(),
});

// Validate payload for updating a cost record.
const updateCost = Joi.object({
    month: Joi.number().integer().min(1).max(12),
    year: Joi.number().integer().min(1900),
    electricityCost: Joi.number().min(0),
    notes: Joi.string().allow('').optional(),
});

module.exports = {
    createCost,
    updateCost,
};
