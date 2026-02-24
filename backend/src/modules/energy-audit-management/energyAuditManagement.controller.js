const energyAuditService = require('./energyAuditManagement.service');
const { createAudit, updateAudit, simulateAudit } = require('./energyAuditManagement.validation');

// Handle creating a new energy audit with AI analysis
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

// Retrieve all energy audits for the authenticated user
exports.getAudits = async (req, res) => {
    try {
        const audits = await energyAuditService.getAudits(req.user.id);
        res.json(audits);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server Error' });
    }
};

// Retrieve a single audit by its unique ID
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

// Handle updating existing audits and re-triggering AI logic if needed
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

// Remove an audit record from the system
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

// Process usage simulations using the AI engine
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

// Handle interactive chat with AI based on audit results context
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
