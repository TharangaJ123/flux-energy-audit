/**
 * @file carbonFootprintTracker.controller.js
 * @description Controller for managing carbon footprint records.
 * Handles validation, delegates CRUD operations to the carbon service,
 * and maps errors to appropriate HTTP status codes.
 */
const carbonService = require('../services/carbonFootprintTracker.service');
const { createCarbonRecord, updateCarbonRecord } = require('../validations/carbonFootprintTracker.validation');

/**
 * @description Retrieve all carbon footprint records for the authenticated user.
 * @async
 * @param {Object} req - Express request with `req.user`.
 * @param {Object} res - Express response object.
 */
const getRecords = async (req, res) => {
    try {
        const records = await carbonService.getRecords(req.user);
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @description Retrieve a single carbon footprint record by its ID.
 * @async
 * @param {Object} req - Express request with `req.params.id` and `req.user`.
 * @param {Object} res - Express response object.
 */
const getRecord = async (req, res) => {
    try {
        const record = await carbonService.getRecordById(req.params.id, req.user);
        res.status(200).json(record);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

/**
 * @description Create a new carbon footprint record after validating the request body.
 * Calculates and stores CO2 emission and emission status automatically via the service layer.
 * @async
 * @param {Object} req - Express request with `req.user` and validated body.
 * @param {Object} res - Express response object.
 */
const createRecord = async (req, res) => {
    try {
        const { error } = createCarbonRecord.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const record = await carbonService.createRecord(req.user, req.body);
        res.status(201).json(record);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @description Update an existing carbon footprint record and recalculate emissions.
 * @async
 * @param {Object} req - Express request with `req.params.id`, `req.user`, and body.
 * @param {Object} res - Express response object.
 */
const updateRecord = async (req, res) => {
    try {
        const { error } = updateCarbonRecord.validate(req.body);
        if (error) {
            return res.status(400).json({ message: error.details[0].message });
        }

        const record = await carbonService.updateRecord(req.params.id, req.user, req.body);
        res.status(200).json(record);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

/**
 * @description Delete a carbon footprint record by its ID.
 * @async
 * @param {Object} req - Express request with `req.params.id` and `req.user`.
 * @param {Object} res - Express response object.
 */
const deleteRecord = async (req, res) => {
    try {
        const result = await carbonService.deleteRecord(req.params.id, req.user);
        res.status(200).json(result);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

module.exports = {
    getRecords,
    getRecord,
    createRecord,
    updateRecord,
    deleteRecord,
};
