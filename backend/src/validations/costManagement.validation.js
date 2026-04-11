const Joi = require('joi');

const MAX_ALLOWED_YEAR = new Date().getFullYear() + 1;
const MAX_ALLOWED_COST = 1000000;
const MAX_FUTURE_MONTHS_FOR_BILLING = 1;

const isBeyondAllowedBillingWindow = ({ month, year }) => {
    const billingDate = new Date(year, month - 1, 1);
    const now = new Date();
    const maxAllowedDate = new Date(now.getFullYear(), now.getMonth() + MAX_FUTURE_MONTHS_FOR_BILLING, 1);
    return billingDate > maxAllowedDate;
};

// Validation schemas for utility cost requests.

const UTILITY_TYPES = ['electricity', 'gas', 'water', 'trash'];

// Validate payload for creating a cost record.
const createCost = Joi.object({
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(1900).max(MAX_ALLOWED_YEAR).required(),
    utilityType: Joi.string().valid(...UTILITY_TYPES).default('electricity'),
    amount: Joi.number().min(0).max(MAX_ALLOWED_COST).required(),
    notes: Joi.string().allow('').optional(),
}).custom((value, helpers) => {
    if (isBeyondAllowedBillingWindow({ month: value.month, year: value.year })) {
        return helpers.message('Billing month cannot be more than 1 month in the future');
    }

    return value;
}, 'billing future month validation');

// Validate payload for updating a cost record.
const updateCost = Joi.object({
    month: Joi.number().integer().min(1).max(12),
    year: Joi.number().integer().min(1900).max(MAX_ALLOWED_YEAR),
    utilityType: Joi.string().valid(...UTILITY_TYPES),
    amount: Joi.number().min(0).max(MAX_ALLOWED_COST),
    notes: Joi.string().allow('').optional(),
}).custom((value, helpers) => {
    if (value.month !== undefined && value.year !== undefined) {
        if (isBeyondAllowedBillingWindow({ month: value.month, year: value.year })) {
            return helpers.message('Billing month cannot be more than 1 month in the future');
        }
    }

    return value;
}, 'billing future month validation');

// Validate payload for tariff-based bill estimation.
const estimateCost = Joi.object({
    units: Joi.number().min(0).required(),
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(1900).max(MAX_ALLOWED_YEAR).optional(),
    provider: Joi.string().valid('CEB', 'LECO').required(),
    peakUnits: Joi.number().min(0).default(0),
    offPeakUnits: Joi.number().min(0).default(0),
});

module.exports = {
    createCost,
    updateCost,
    estimateCost,
};
