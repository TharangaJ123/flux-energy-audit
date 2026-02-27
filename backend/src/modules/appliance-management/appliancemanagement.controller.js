const applianceService = require('./appliancemanagement.service');
const { applianceValidationSchema, updateApplianceValidationSchema } = require('./appliancemanagement.validation');

// Create a new appliance record
const createAppliance = async (req, res) => {
    try {
        // Validate request body
        const { error } = applianceValidationSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        // Call service to add appliance
        const appliance = await applianceService.addAppliance(req.body, req.user.id);
        res.status(201).json({
            message: 'Appliance added successfully',
            data: appliance,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error adding appliance', error: err.message });
    }
};

// Retrieve all appliances for the current user
const getAllAppliances = async (req, res) => {
    try {
        const appliances = await applianceService.getAppliancesByUser(req.user.id);
        res.status(200).json({
            message: 'Appliances retrieved successfully',
            results: appliances.length,
            data: appliances,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching appliances', error: err.message });
    }
};

// Get a single appliance by its ID
const getAppliance = async (req, res) => {
    try {
        const appliance = await applianceService.getApplianceById(req.params.id, req.user.id);
        if (!appliance) {
            return res.status(404).json({ message: 'Appliance not found' });
        }
        res.status(200).json({
            message: 'Appliance retrieved successfully',
            data: appliance,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching appliance', error: err.message });
    }
};

// Update an existing appliance
const updateAppliance = async (req, res) => {
    try {
        // Validate update data
        const { error } = updateApplianceValidationSchema.validate(req.body, { allowUnknown: true });
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const appliance = await applianceService.updateAppliance(req.params.id, req.user.id, req.body);
        if (!appliance) {
            return res.status(404).json({ message: 'Appliance not found' });
        }
        res.status(200).json({
            message: 'Appliance updated successfully',
            data: appliance,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error updating appliance', error: err.message });
    }
};

// Delete an appliance
const deleteAppliance = async (req, res) => {
    try {
        const appliance = await applianceService.deleteAppliance(req.params.id, req.user.id);
        if (!appliance) {
            return res.status(404).json({ message: 'Appliance not found' });
        }
        res.status(200).json({
            message: 'Appliance deleted successfully',
        });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting appliance', error: err.message });
    }
};

// Get energy consumption report with weather data
const getEnergyAudit = async (req, res) => {
    try {
        const { city } = req.query;
        const report = await applianceService.getTotalEnergyConsumption(req.user.id, city);
        res.status(200).json({
            message: 'Energy audit retrieved successfully',
            data: report,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error generating energy audit', error: err.message });
    }
};

// Get summary statistics for all appliances
const getApplianceStats = async (req, res) => {
    try {
        const stats = await applianceService.getApplianceStats(req.user.id);
        res.status(200).json({
            message: 'Appliance statistics retrieved successfully',
            data: stats,
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching appliance statistics', error: err.message });
    }
};

module.exports = {
    createAppliance,
    getAllAppliances,
    getAppliance,
    updateAppliance,
    deleteAppliance,
    getEnergyAudit,
    getApplianceStats,
};


