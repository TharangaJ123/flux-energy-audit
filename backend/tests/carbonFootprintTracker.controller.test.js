/**
 * @file carbonFootprintTracker.controller.test.js
 * @description Unit tests for the Carbon Footprint Tracker controller.
 * Mongoose is mocked at the module level to prevent any database connection
 * attempts during test runs. The carbon service is fully stubbed so each test
 * verifies only controller-level logic: validation, status codes, and error mapping.
 */
const carbonController = require('../src/controllers/carbonFootprintTracker.controller');
const carbonService = require('../src/services/carbonFootprintTracker.service');
const mongoose = require('mongoose');

// Prevent Mongoose from attempting a real DB connection in the unit-test environment.
jest.mock('mongoose', () => ({
    connect: jest.fn(),
    connection: {
        readyState: 1,
        close: jest.fn(),
    },
    Schema: function() { return { index: jest.fn() }; },
    model: jest.fn(),
}));

// Mock the service
jest.mock('../src/services/carbonFootprintTracker.service', () => ({
    getRecords: jest.fn(),
    getRecordById: jest.fn(),
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
}));

const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('carbonFootprintTracker.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getRecords', () => {
        test('returns 200 and all records', async () => {
            const req = { user: { id: 'user-1' } };
            const res = createRes();
            const mockRecords = [{ id: '1', co2Emission: 100 }];
            carbonService.getRecords.mockResolvedValue(mockRecords);

            await carbonController.getRecords(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecords);
        });

        test('returns 500 when service fails', async () => {
            const req = { user: { id: 'user-1' } };
            const res = createRes();
            carbonService.getRecords.mockRejectedValue(new Error('Internal Error'));

            await carbonController.getRecords(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal Error' });
        });
    });

    describe('getRecord', () => {
        test('returns 200 when record exists', async () => {
            const req = { params: { id: '1' }, user: { id: 'user-1' } };
            const res = createRes();
            const mockRecord = { id: '1', co2Emission: 100 };
            carbonService.getRecordById.mockResolvedValue(mockRecord);

            await carbonController.getRecord(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecord);
        });

        test('returns 404 when record not found', async () => {
            const req = { params: { id: '999' }, user: { id: 'user-1' } };
            const res = createRes();
            carbonService.getRecordById.mockRejectedValue(new Error('Record not found'));

            await carbonController.getRecord(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Record not found' });
        });
    });

    describe('createRecord', () => {
        test('returns 201 when creation is successful', async () => {
            const req = {
                user: { id: 'user-1' },
                body: { month: 'January', year: 2024, electricity: 100 }
            };
            const res = createRes();
            const mockRecord = { id: '1', ...req.body, co2Emission: 85 };
            carbonService.createRecord.mockResolvedValue(mockRecord);

            await carbonController.createRecord(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockRecord);
        });

        test('returns 400 when validation fails (missing month)', async () => {
            const req = {
                user: { id: 'user-1' },
                body: { year: 2024 } // Missing month
            };
            const res = createRes();

            await carbonController.createRecord(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.any(String)
            }));
        });
    });

    describe('updateRecord', () => {
        test('returns 200 when update is successful', async () => {
            const req = {
                params: { id: '1' },
                user: { id: 'user-1' },
                body: { electricity: 150 }
            };
            const res = createRes();
            const mockRecord = { id: '1', electricity: 150, co2Emission: 127.5 };
            carbonService.updateRecord.mockResolvedValue(mockRecord);

            await carbonController.updateRecord(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockRecord);
        });
    });

    describe('deleteRecord', () => {
        test('returns 200 when deletion is successful', async () => {
            const req = { params: { id: '1' }, user: { id: 'user-1' } };
            const res = createRes();
            carbonService.deleteRecord.mockResolvedValue({ message: 'Record removed successfully' });

            await carbonController.deleteRecord(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Record removed successfully' });
        });
    });
});
