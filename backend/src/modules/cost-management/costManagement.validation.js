const Joi = require('joi');

const createCost = Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(1900).required(),
    electricityCost: Joi.number().min(0).required(),
    notes: Joi.string().allow('').optional(),
});

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
