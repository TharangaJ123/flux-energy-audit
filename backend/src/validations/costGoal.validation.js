const Joi = require('joi');

const MAX_ALLOWED_YEAR = new Date().getFullYear() + 1;
const MAX_ALLOWED_GOAL_AMOUNT = 1000000;

const UTILITY_TYPES = ['electricity', 'gas', 'water', 'trash'];

// Validation schemas for cost goal requests.

// Validate payload for creating a cost goal.
const createGoal = Joi.object({
    type: Joi.string().valid('monthly', 'yearly').required(),
    utilityType: Joi.string().valid(...UTILITY_TYPES).default('electricity'),
    year: Joi.number().integer().min(1900).max(MAX_ALLOWED_YEAR).required(),
    month: Joi.when('type', {
        is: 'monthly',
        then: Joi.number().integer().min(1).max(12).required(),
        otherwise: Joi.forbidden(),
    }),
    goalAmount: Joi.number().min(0).max(MAX_ALLOWED_GOAL_AMOUNT).required(),
    notes: Joi.string().allow('').optional(),
});

// Validate payload for updating a cost goal.
const updateGoal = Joi.object({
    type: Joi.string().valid('monthly', 'yearly'),
    utilityType: Joi.string().valid(...UTILITY_TYPES),
    year: Joi.number().integer().min(1900).max(MAX_ALLOWED_YEAR),
    month: Joi.when('type', {
        is: 'monthly',
        then: Joi.number().integer().min(1).max(12).required(),
        otherwise: Joi.number().integer().min(1).max(12),
    }),
    goalAmount: Joi.number().min(0).max(MAX_ALLOWED_GOAL_AMOUNT),
    notes: Joi.string().allow('').optional(),
}).when(Joi.object({ type: Joi.valid('yearly') }).unknown(), {
    then: Joi.object({ month: Joi.forbidden() }),
});

module.exports = {
    createGoal,
    updateGoal,
};
