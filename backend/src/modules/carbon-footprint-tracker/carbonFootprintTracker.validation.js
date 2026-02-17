const Joi = require('joi');

const createCarbonRecord = Joi.object({
    month: Joi.string().required().messages({
        'string.empty': 'Month is required',
        'any.required': 'Month is required',
    }),
    year: Joi.number().integer().min(2000).max(2100).required().messages({
        'number.base': 'Year must be a number',
        'any.required': 'Year is required',
    }),
    electricity: Joi.number().min(0).default(0),
    gasSelections: Joi.array().items(Joi.string()),
    gasAmounts: Joi.object().pattern(Joi.string(), Joi.number().min(0)),
    transportSelections: Joi.array().items(Joi.string()),
    transportDistances: Joi.object().pattern(Joi.string(), Joi.number().min(0)),
    waste: Joi.number().min(0).default(0),
});

const updateCarbonRecord = Joi.object({
    month: Joi.string(),
    year: Joi.number().integer().min(2000).max(2100),
    electricity: Joi.number().min(0),
    gasSelections: Joi.array().items(Joi.string()),
    gasAmounts: Joi.object().pattern(Joi.string(), Joi.number().min(0)),
    transportSelections: Joi.array().items(Joi.string()),
    transportDistances: Joi.object().pattern(Joi.string(), Joi.number().min(0)),
    waste: Joi.number().min(0),
}).min(1);

module.exports = {
    createCarbonRecord,
    updateCarbonRecord,
};
