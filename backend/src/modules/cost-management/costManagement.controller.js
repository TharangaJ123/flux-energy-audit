const costService = require('./costManagement.service');
const { createCost, updateCost, estimateCost } = require('./costManagement.validation');

// Controller handlers for electricity costs.

// Create a monthly electricity cost record.
const create = async (req, res) => {
    try {
        const { error } = createCost.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const cost = await costService.createCost(req.user._id, req.body);
        res.status(201).json(cost);
    } catch (error) {
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
        res.status(404).json({ message: error.message });
    }
};

// Update an existing electricity cost record.
const update = async (req, res) => {
    try {
        const { error } = updateCost.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const cost = await costService.updateCost(req.user._id, req.params.id, req.body);
        res.status(200).json(cost);
    } catch (error) {
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
        res.status(200).json(result);
    } catch (error) {
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

module.exports = {
    create,
    list,
    getById,
    update,
    remove,
    estimate,
};
