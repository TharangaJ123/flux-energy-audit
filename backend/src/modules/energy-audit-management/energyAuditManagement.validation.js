const Joi = require('joi');

const createAudit = Joi.object({
    month: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
        'string.pattern.base': 'Month must be in YYYY-MM format',
    }),
    totalUnits: Joi.number().min(0).required(),
    peakUsage: Joi.string().valid('Day', 'Night').required(),
    appliances: Joi.array().items(
        Joi.object({
            name: Joi.string().required(),
            power: Joi.number().positive().required(),
            hours: Joi.number().min(0).max(24).required(),
        })
    ).min(1).required(),
    householdSize: Joi.number().min(1).default(1),
    previousMonthUnits: Joi.number().min(0).optional(),
});

const updateAudit = Joi.object({
    totalUnits: Joi.number().min(0),
    peakUsage: Joi.string().valid('Day', 'Night'),
    appliances: Joi.array().items(
        Joi.object({
            name: Joi.string(),
            power: Joi.number().positive(),
            hours: Joi.number().min(0).max(24),
        })
    ),
    householdSize: Joi.number().min(1),
});

const simulateAudit = Joi.object({
    changes: Joi.array().items(
        Joi.object({
            parameter: Joi.string().valid('hours', 'power', 'count').required(),
            applianceName: Joi.string().required(),
            value: Joi.number().required(),
        })
    ).required()
});

module.exports = {
    createAudit,
    updateAudit,
    simulateAudit
};
