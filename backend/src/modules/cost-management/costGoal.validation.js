const Joi = require('joi');

// Validation schemas for cost goal requests.

// Validate payload for creating a cost goal.
const createGoal = Joi.object({
    type: Joi.string().valid('monthly', 'yearly').required(),
    year: Joi.number().integer().min(1900).required(),
    month: Joi.when('type', {
        is: 'monthly',
        then: Joi.number().integer().min(1).max(12).required(),
        otherwise: Joi.forbidden(),
    }),
    goalAmount: Joi.number().min(0).required(),
    notes: Joi.string().allow('').optional(),
});

// Validate payload for updating a cost goal.
const updateGoal = Joi.object({
    type: Joi.string().valid('monthly', 'yearly'),
    year: Joi.number().integer().min(1900),
    month: Joi.when('type', {
        is: 'monthly',
        then: Joi.number().integer().min(1).max(12).required(),
        otherwise: Joi.number().integer().min(1).max(12),
    }),
    goalAmount: Joi.number().min(0),
    notes: Joi.string().allow('').optional(),
}).when(Joi.object({ type: Joi.valid('yearly') }).unknown(), {
    then: Joi.object({ month: Joi.forbidden() }),
});

module.exports = {
    createGoal,
    updateGoal,
};
