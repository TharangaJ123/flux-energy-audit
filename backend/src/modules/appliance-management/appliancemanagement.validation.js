const Joi = require('joi');

// Schema for creating a new appliance
const applianceValidationSchema = Joi.object({
    name: Joi.string().required().trim().messages({
        'string.empty': 'Appliance name is required',
    }),
    powerConsumption: Joi.number().positive().required().messages({
        'number.base': 'Power consumption must be a number',
        'number.positive': 'Power consumption must be greater than zero',
    }),
    usageHours: Joi.number().min(0).max(24).required().messages({
        'number.base': 'Usage hours must be a number',
        'number.min': 'Usage hours cannot be negative',
        'number.max': 'Usage hours cannot exceed 24 hours',
    }),
    category: Joi.string().trim().optional(),
});

// Schema for updating an existing appliance (all fields optional)
const updateApplianceValidationSchema = Joi.object({
    name: Joi.string().trim(),
    powerConsumption: Joi.number().positive(),
    usageHours: Joi.number().min(0).max(24),
    category: Joi.string().trim(),
}).min(1); // At least one field must be provided

module.exports = {
    applianceValidationSchema,
    updateApplianceValidationSchema,
};

