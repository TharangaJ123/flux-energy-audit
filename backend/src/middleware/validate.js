/**
 * @file validate.js
 * @description Generic validation middleware using Joi schemas.
 * Validates request bodies and returns formatted 400 errors to the client.
 */
const Joi = require('joi');

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return res.status(400).json({ error: errorMessage });
        }

        next();
    };
};

module.exports = validate;
