const carbonService = require('./carbonFootprintTracker.service');
const { createCarbonRecord, updateCarbonRecord } = require('./carbonFootprintTracker.validation');

const getRecords = async (req, res) => {
    try {
        const records = await carbonService.getRecords(req.user);
        res.status(200).json(records);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRecord = async (req, res) => {
    try {
        const record = await carbonService.getRecordById(req.params.id, req.user);
        res.status(200).json(record);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

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
