/**
 * @file appliancemanagement.integration.test.js
 * @description Integration tests for the Appliance Management REST API.
 *
 * Tests run against a real MongoDB connection (via the global setup in `tests/setup.js`)
 * so that the full request → route → controller → service → database round-trip is exercised.
 *
 * External dependencies that are not under test (authentication middleware and the
 * weather service) are Jest-mocked to keep tests deterministic and avoid network calls.
 */
const request = require('supertest');
const mongoose = require('mongoose');
const createApp = require('../src/app');
const Appliance = require('../src/models/appliancemanagement.model');
const weatherService = require('../src/services/weatherService');

// ─── Mocks ──────────────────────────────────────────────────────────────────

/**
 * Replace the real auth middleware with a passthrough stub that injects a fixed
 * test user into `req.user`. This allows all routes to proceed without a real JWT.
 */
jest.mock('../src/middleware/auth', () => ({
    protect: (req, res, next) => {
        req.user = { id: '60d5ecb8b39d1c0015f1a234', _id: '60d5ecb8b39d1c0015f1a234', role: 'user' };
        next();
    },
    authorize: (...roles) => (req, res, next) => next()
}));

/**
 * Mock the weather service so energy-audit tests do not depend on an external API.
 * The resolved value mirrors the shape returned by the real service.
 */
jest.mock('../src/services/weatherService', () => ({
    getCurrentWeather: jest.fn()
}));

describe('Appliance Management Integration Tests', () => {
    let app;

    // Initialise the Express app and pre-configure weather service mock results.
    beforeAll(() => {
        app = createApp();
        weatherService.getCurrentWeather.mockResolvedValue({
            temp: 28,
            description: 'clear sky',
            humidity: 60,
            city: 'Colombo',
            insight: 'The weather is moderate. Optimal for low energy consumption.'
        });
    });

    // Clear all appliance records and reset mock state before each test to avoid cross-test contamination.
    beforeEach(async () => {
        await Appliance.deleteMany({});
        jest.clearAllMocks();
    });

    /** Baseline appliance payload reused across multiple test cases. */
    const mockAppliance = {
        name: 'Test Air Conditioner',
        powerConsumption: 1500,
        usageHours: 5,
        category: 'Cooling'
    };

    // ── POST /api/appliances ─────────────────────────────────────────────────
    describe('POST /api/appliances', () => {
        test('should create a new appliance with valid data', async () => {
            const response = await request(app)
                .post('/api/appliances')
                .send(mockAppliance);

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Appliance added successfully');
            expect(response.body.data.name).toBe(mockAppliance.name);
            
            const applianceInDb = await Appliance.findById(response.body.data._id);
            expect(applianceInDb).toBeDefined();
            expect(applianceInDb.name).toBe(mockAppliance.name);
            expect(applianceInDb.user.toString()).toBe('60d5ecb8b39d1c0015f1a234');
        });

        test('should return 400 if required fields are missing', async () => {
            const response = await request(app)
                .post('/api/appliances')
                .send({ name: 'Incomplete' });

            expect(response.status).toBe(400);
        });
    });

    // ── GET /api/appliances ──────────────────────────────────────────────────
    describe('GET /api/appliances', () => {
        test('should retrieve all appliances for the user', async () => {
            await Appliance.create({ ...mockAppliance, user: '60d5ecb8b39d1c0015f1a234' });
            await Appliance.create({ name: 'Fan', powerConsumption: 50, usageHours: 10, category: 'Cooling', user: '60d5ecb8b39d1c0015f1a234' });

            const response = await request(app).get('/api/appliances');

            expect(response.status).toBe(200);
            expect(response.body.results).toBe(2);
            expect(response.body.data.length).toBe(2);
        });
    });

    // ── GET /api/appliances/:id ──────────────────────────────────────────────
    describe('GET /api/appliances/:id', () => {
        test('should retrieve a single appliance by ID', async () => {
            const created = await Appliance.create({ ...mockAppliance, user: '60d5ecb8b39d1c0015f1a234' });

            const response = await request(app).get(`/api/appliances/${created._id}`);

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe(mockAppliance.name);
        });

        test('should return 404 if appliance does not exist', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const response = await request(app).get(`/api/appliances/${fakeId}`);

            expect(response.status).toBe(404);
        });
    });

    // ── PUT /api/appliances/:id ──────────────────────────────────────────────
    describe('PUT /api/appliances/:id', () => {
        test('should update an existing appliance', async () => {
            const created = await Appliance.create({ ...mockAppliance, user: '60d5ecb8b39d1c0015f1a234' });

            const response = await request(app)
                .put(`/api/appliances/${created._id}`)
                .send({ name: 'Updated AC', powerConsumption: 1200 });

            expect(response.status).toBe(200);
            expect(response.body.data.name).toBe('Updated AC');
            expect(response.body.data.powerConsumption).toBe(1200);
        });
    });

    // ── DELETE /api/appliances/:id ───────────────────────────────────────────
    describe('DELETE /api/appliances/:id', () => {
        test('should delete an appliance', async () => {
            const created = await Appliance.create({ ...mockAppliance, user: '60d5ecb8b39d1c0015f1a234' });

            const response = await request(app).delete(`/api/appliances/${created._id}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Appliance deleted successfully');

            const inDb = await Appliance.findById(created._id);
            expect(inDb).toBeNull();
        });
    });

    // ── GET /api/appliances/audit ────────────────────────────────────────────
    describe('GET /api/appliances/audit', () => {
        test('should return energy audit report with weather insights', async () => {
            await Appliance.create({ ...mockAppliance, user: '60d5ecb8b39d1c0015f1a234' });

            weatherService.getCurrentWeather.mockResolvedValue({
                temp: 28,
                description: 'clear sky',
                humidity: 60,
                city: 'Colombo',
                insight: 'The weather is moderate. Optimal for low energy consumption.'
            });

            const response = await request(app).get('/api/appliances/audit?city=Colombo');

            if (response.status !== 200) {
                console.error('Audit failure response:', response.body);
            }

            expect(response.status).toBe(200);
            expect(response.body.data).toHaveProperty('dailyTotalKWh');
            expect(response.body.data).toHaveProperty('monthlyTotalKWh');
            expect(response.body.data.weatherInsights).toBeDefined();
            expect(response.body.data.weatherInsights.city).toBe('Colombo');
        });
    });

    // ── GET /api/appliances/stats ────────────────────────────────────────────
    describe('GET /api/appliances/stats', () => {
        test('should return statistical summary', async () => {
            await Appliance.create({ ...mockAppliance, user: '60d5ecb8b39d1c0015f1a234' });

            const response = await request(app).get('/api/appliances/stats');

            expect(response.status).toBe(200);
            expect(response.body.data.totalAppliances).toBe(1);
            expect(response.body.data.highestConsumer.name).toBe(mockAppliance.name);
        });

        test('should return zero stats if no appliances', async () => {
            const response = await request(app).get('/api/appliances/stats');

            expect(response.status).toBe(200);
            expect(response.body.data.totalAppliances).toBe(0);
        });
    });
});

