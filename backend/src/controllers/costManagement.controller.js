const costService = require('../services/costManagement.service');
const { createCost, updateCost, estimateCost } = require('../validations/costManagement.validation');
const { enqueueFileScan } = require('../services/fileScan.service');
const fs = require('fs');
const path = require('path');

// Controller handlers for electricity costs.

const normalizeCreatePayload = (body) => ({
    month: typeof body.month === 'string' ? parseInt(body.month, 10) : body.month,
    year: typeof body.year === 'string' ? parseInt(body.year, 10) : body.year,
    utilityType: body.utilityType || 'electricity',
    amount:
        typeof body.amount === 'string'
            ? parseFloat(body.amount)
            : body.amount || (typeof body.electricityCost === 'string' ? parseFloat(body.electricityCost) : body.electricityCost),
    notes: body.notes,
});

const normalizeUpdatePayload = (body) => {
    const payload = {
        ...body,
    };

    if (body.month !== undefined) {
        payload.month = typeof body.month === 'string' ? parseInt(body.month, 10) : body.month;
    }
    if (body.year !== undefined) {
        payload.year = typeof body.year === 'string' ? parseInt(body.year, 10) : body.year;
    }
    if (body.utilityType !== undefined) {
        payload.utilityType = body.utilityType;
    }
    if (body.amount !== undefined || body.electricityCost !== undefined) {
        const rawAmount = body.amount ?? body.electricityCost;
        payload.amount = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
    }

    return payload;
};

const removeUploadedFile = async (absolutePath) => {
    if (!absolutePath || !fs.existsSync(absolutePath)) {
        return;
    }

    await fs.promises.unlink(absolutePath);
};

const resolveStoredDocumentPath = (documentPath) => {
    if (!documentPath) {
        return null;
    }

    const normalizedPath = documentPath.replace(/^\//, '');
    return path.join(__dirname, '..', '..', normalizedPath);
};

// Create a monthly electricity cost record.
const create = async (req, res) => {
    try {
        const payload = normalizeCreatePayload(req.body);
        const { error } = createCost.validate(payload);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        if (req.file) {
            payload.document = {
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: `/uploads/bills/${req.file.filename}`,
            };

            enqueueFileScan({
                absolutePath: req.file.path,
                metadata: {
                    type: 'cost-create',
                    userId: req.user._id,
                },
            });
        }

        const cost = await costService.createCost(req.user._id, payload);
        res.status(201).json(cost);
    } catch (error) {
        if (req.file?.path) {
            await removeUploadedFile(req.file.path);
        }

        if (error.message === 'Billing month cannot be more than 1 month in the future') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Cost for this month already exists') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// List all electricity cost records for the authenticated user.
const list = async (req, res) => {
    try {
        const costs = await costService.getCosts(req.user._id);
        res.status(200).json(costs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get one electricity cost record by id.
const getById = async (req, res) => {
    try {
        const cost = await costService.getCostById(req.user._id, req.params.id);
        res.status(200).json(cost);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid cost id' });
        }
        if (error.message === 'Cost not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// Update an existing electricity cost record.
const update = async (req, res) => {
    try {
        const payload = normalizeUpdatePayload(req.body);
        const { error } = updateCost.validate(payload);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        if (req.file) {
            payload.document = {
                originalName: req.file.originalname,
                mimeType: req.file.mimetype,
                size: req.file.size,
                path: `/uploads/bills/${req.file.filename}`,
            };

            enqueueFileScan({
                absolutePath: req.file.path,
                metadata: {
                    type: 'cost-update',
                    userId: req.user._id,
                    costId: req.params.id,
                },
            });
        }

        const { updatedCost, replacedDocumentPath } = await costService.updateCost(req.user._id, req.params.id, payload);

        if (replacedDocumentPath) {
            const oldDocumentAbsolutePath = resolveStoredDocumentPath(replacedDocumentPath);
            await removeUploadedFile(oldDocumentAbsolutePath);
        }

        res.status(200).json(updatedCost);
    } catch (error) {
        if (req.file?.path) {
            await removeUploadedFile(req.file.path);
        }
        if (error.message === 'Billing month cannot be more than 1 month in the future') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Cost for this month already exists') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Cost not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// Delete an electricity cost record.
const remove = async (req, res) => {
    try {
        const result = await costService.deleteCost(req.user._id, req.params.id);
        const documentAbsolutePath = resolveStoredDocumentPath(result.documentPath);
        await removeUploadedFile(documentAbsolutePath);
        res.status(200).json({ message: result.message });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid cost id' });
        }
        if (error.message === 'Cost not found') {
            return res.status(404).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// Estimate a tariff-based electricity bill with detailed breakdown.
const estimate = async (req, res) => {
    try {
        const { error, value } = estimateCost.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const estimation = await costService.estimateCostByTariff(value);
        res.status(200).json(estimation);
    } catch (error) {
        if (
            error.message === 'Unsupported provider' ||
            error.message === 'Peak and off-peak units cannot exceed total units'
        ) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: error.message });
    }
};

// Download a bill document through an authenticated endpoint.
const downloadDocument = async (req, res) => {
    try {
        const cost = await costService.getCostById(req.user._id, req.params.id);
        if (!cost.document?.path) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const absolutePath = resolveStoredDocumentPath(cost.document.path);
        if (!absolutePath || !fs.existsSync(absolutePath)) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const safeFileName = cost.document.originalName || path.basename(absolutePath);
        return res.download(absolutePath, safeFileName);
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid cost id' });
        }
        if (error.message === 'Cost not found') {
            return res.status(404).json({ message: error.message });
        }
        return res.status(500).json({ message: error.message });
    }
};

// Get AI-driven spending insights.
const getAIInsights = async (req, res) => {
    try {
        const insights = await costService.getAIInsights(req.user._id);
        res.status(200).json(insights);
    } catch (error) {
        console.error('AI Insights Error:', error.message);
        res.status(500).json({ message: 'Error generating AI insights' });
    }
};

module.exports = {
    create,
    list,
    getById,
    update,
    remove,
    estimate,
    downloadDocument,
    getAIInsights,
};
