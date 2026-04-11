const request = require('supertest');
const mongoose = require('mongoose');

// Mock CarbonFootprint model - HOISTED
jest.mock('../src/models/carbonFootprintTracker.model', () => {
    const mockRecord = {
        _id: '60d5ecb8b39d1c0015f1a555',
        month: 'April',
        year: 2024,
        electricity: 100,
        gasData: { selections: [], amounts: {} },
        transportData: { selections: [], distances: {} },
        waste: 10,
        co2Emission: 85,
        status: 'Low',
        save: jest.fn().mockResolvedValue(true),
        deleteOne: jest.fn().mockResolvedValue({ message: 'Record removed successfully' }),
        session: jest.fn().mockReturnThis()
    };

    const Model = jest.fn().mockImplementation(() => mockRecord);
    Model.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([mockRecord]) });
    Model.findOne = jest.fn().mockReturnValue({ session: jest.fn().mockReturnThis(), deleteOne: jest.fn().mockResolvedValue({ message: 'Record removed successfully' }), save: jest.fn().mockReturnThis() });
    Model.findById = jest.fn().mockResolvedValue(mockRecord);
    Model.create = jest.fn().mockResolvedValue(mockRecord);
    Model.deleteMany = jest.fn().mockResolvedValue({});
    
    return Model;
});

const createApp = require('../src/app');
const CarbonFootprint = require('../src/models/carbonFootprintTracker.model');

// Mock Auth Middleware
jest.mock('../src/middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { id: '60d5ecb8b39d1c0015f1a234', _id: '60d5ecb8b39d1c0015f1a234', role: 'user' };
        next();
    },
    authorize: (...roles) => (req, res, next) => next()
}));

// Mock Transaction Utility
jest.mock('../src/util/transaction', () => ({
    runInTransaction: (callback) => callback(null) // Mocking session as null
}));

describe('Carbon Footprint Tracker Integration Tests', () => {
    let app;

    beforeAll(() => {
        app = createApp();
    });

    beforeEach(async () => {
        await CarbonFootprint.deleteMany({});
        jest.clearAllMocks();
    });

    const mockRecord = {
        month: 'April',
        year: 2024,
        electricity: 100,
        gasSelections: ['natural', 'lpg'],
        gasAmounts: { natural: 10, lpg: 5 },
        transportSelections: ['petrolCar', 'bus'],
        transportDistances: { petrolCar: 50, bus: 20 },
        waste: 10
    };

    describe('POST /api/carbon', () => {
        test('should create a new carbon footprint record', async () => {
            const response = await request(app)
                .post('/api/carbon')
                .send(mockRecord);

            expect(response.status).toBe(201);
            expect(response.body.month).toBe(mockRecord.month);
            expect(response.body.co2Emission).toBeDefined();
            expect(response.body.status).toBeDefined();

            const recordInDb = await CarbonFootprint.findById(response.body._id);
            expect(recordInDb).toBeDefined();
            expect(recordInDb.month).toBe(mockRecord.month);
        });

        test('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/carbon')
                .send({ electricity: 100 }); // Missing month/year

            expect(response.status).toBe(400);
        });
    });

    describe('GET /api/carbon', () => {
        test('should retrieve all records for the user', async () => {
            await CarbonFootprint.create({
                ...mockRecord,
                user: '60d5ecb8b39d1c0015f1a234',
                co2Emission: 100,
                status: 'Moderate',
                gasData: { selections: mockRecord.gasSelections, amounts: mockRecord.gasAmounts },
                transportData: { selections: mockRecord.transportSelections, distances: mockRecord.transportDistances }
            });

            const response = await request(app).get('/api/carbon');

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBe(1);
        });
    });

    describe('GET /api/carbon/:id', () => {
        test('should retrieve a specific record by ID', async () => {
            const created = await CarbonFootprint.create({
                ...mockRecord,
                user: '60d5ecb8b39d1c0015f1a234',
                co2Emission: 100,
                status: 'Moderate',
                gasData: { selections: mockRecord.gasSelections, amounts: mockRecord.gasAmounts },
                transportData: { selections: mockRecord.transportSelections, distances: mockRecord.transportDistances }
            });

            const response = await request(app).get(`/api/carbon/${created._id}`);

            expect(response.status).toBe(200);
            expect(response.body.month).toBe(mockRecord.month);
        });

        test('should return 404 if record does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app).get(`/api/carbon/${fakeId}`);

            expect(response.status).toBe(404);
        });
    });

    describe('PUT /api/carbon/:id', () => {
        test('should update an existing record', async () => {
            const created = await CarbonFootprint.create({
                ...mockRecord,
                user: '60d5ecb8b39d1c0015f1a234',
                co2Emission: 100,
                status: 'Moderate',
                gasData: { selections: mockRecord.gasSelections, amounts: mockRecord.gasAmounts },
                transportData: { selections: mockRecord.transportSelections, distances: mockRecord.transportDistances }
            });

            const response = await request(app)
                .put(`/api/carbon/${created._id}`)
                .send({ electricity: 200 });

            expect(response.status).toBe(200);
            expect(response.body.electricity).toBe(200);
            expect(response.body.co2Emission).not.toBe(100); // Should be recalculated
        });
    });

    describe('DELETE /api/carbon/:id', () => {
        test('should delete a record', async () => {
            const created = await CarbonFootprint.create({
                ...mockRecord,
                user: '60d5ecb8b39d1c0015f1a234',
                co2Emission: 100,
                status: 'Moderate',
                gasData: { selections: mockRecord.gasSelections, amounts: mockRecord.gasAmounts },
                transportData: { selections: mockRecord.transportSelections, distances: mockRecord.transportDistances }
            });

            const response = await request(app).delete(`/api/carbon/${created._id}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Record removed successfully');

            const inDb = await CarbonFootprint.findById(created._id);
            expect(inDb).toBeNull();
        });
    });
});
