/**
 * @file energyAuditManagement.controller.js
 * @description Controller for energy audit operations with AI-driven analysis.
 * Each handler validates incoming data, delegates business logic to the service
 * layer, and maps domain errors to appropriate HTTP status codes.
 */
const energyAuditService = require('../services/energyAuditManagement.service');
const { createAudit, updateAudit, simulateAudit } = require('../validations/energyAuditManagement.validation');

/**
 * @description Create a new energy audit record enriched with AI insights.
 * @async
 * @param {Object} req - Express request with `req.user.id` and validated body.
 * @param {Object} res - Express response object.
 */
exports.createAudit = async (req, res) => {
    try {
        const { error } = createAudit.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const audit = await energyAuditService.createAudit(req.user.id, req.body);
        res.status(201).json(audit);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * @description Retrieve all energy audits belonging to the authenticated user.
 * @async
 * @param {Object} req - Express request with `req.user.id`.
 * @param {Object} res - Express response object.
 */
exports.getAudits = async (req, res) => {
    try {
        const audits = await energyAuditService.getAudits(req.user.id);
        res.json(audits);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * @description Retrieve a single audit by its ID, scoped to the authenticated user.
 * @async
 * @param {Object} req - Express request with `req.params.id` and `req.user.id`.
 * @param {Object} res - Express response object.
 */
exports.getAuditById = async (req, res) => {
    try {
        const audit = await energyAuditService.getAuditById(req.params.id, req.user.id);
        res.json(audit);
    } catch (err) {
        if (err.message === 'Audit not found') return res.status(404).json({ error: 'Audit not found' });
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * @description Update an existing audit. Re-runs AI analysis when usage data changes.
 * @async
 * @param {Object} req - Express request with `req.params.id`, `req.user.id`, and body.
 * @param {Object} res - Express response object.
 */
exports.updateAudit = async (req, res) => {
    try {
        const { error } = updateAudit.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const audit = await energyAuditService.updateAudit(req.params.id, req.user.id, req.body);
        res.json(audit);
    } catch (err) {
        if (err.message === 'Audit not found') return res.status(404).json({ error: 'Audit not found' });
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * @description Permanently delete an audit record owned by the authenticated user.
 * @async
 * @param {Object} req - Express request with `req.params.id` and `req.user.id`.
 * @param {Object} res - Express response object.
 */
exports.deleteAudit = async (req, res) => {
    try {
        await energyAuditService.deleteAudit(req.params.id, req.user.id);
        res.json({ message: 'Audit removed' });
    } catch (err) {
        if (err.message === 'Audit not found') return res.status(404).json({ error: 'Audit not found' });
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * @description Run a what-if simulation against an existing audit using the AI engine.
 * Accepts a `changes` array describing hypothetical usage modifications.
 * @async
 * @param {Object} req - Express request with params, user, and `body.changes`.
 * @param {Object} res - Express response object.
 */
exports.simulateChange = async (req, res) => {
    try {
        const { error } = simulateAudit.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const result = await energyAuditService.simulateChange(req.params.id, req.user.id, req.body.changes);
        res.json(result);
    } catch (err) {
        if (err.message === 'Audit not found') return res.status(404).json({ error: 'Audit not found' });
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

/**
 * @description Initiate or continue an AI chat conversation scoped to a specific audit.
 * Passes the user's `message` and optional conversation `history` to the AI service.
 * @async
 * @param {Object} req - Express request with params, user, `body.message`, and optional `body.history`.
 * @param {Object} res - Express response object.
 */
exports.chatWithAudit = async (req, res) => {
    try {
        const { message, history } = req.body;
        if (!message) return res.status(400).json({ error: 'Message is required' });

        const response = await energyAuditService.chatWithAudit(req.params.id, req.user.id, message, history || []);
        res.json({ response });
    } catch (err) {
        if (err.message === 'Audit not found') return res.status(404).json({ error: 'Audit not found' });
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
}
