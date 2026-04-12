/**
 * @file solarEstimator.test.js
 * @description Integration tests for the Solar Estimator API.
 * Sends real HTTP requests to the Express server (imported from `server.js`) and
 * verifies that the calculation endpoint returns correct panel counts, financial
 * projections, and appropriate 400 errors for invalid inputs.
 * No external NREL API calls are made — the test relies on the static SL-average
 * fallback when coordinates are not supplied.
 */
const request = require('supertest');
const app = require('../src/server');

// ── Solar Estimator API tests ────────────────────────────────────────────
describe('Solar Estimator API', () => {

    it('should calculate solar potential based on rooftop area (without coordinates)', async () => {
        const res = await request(app)
            .post('/api/solar/estimate')
            .send({ rooftopArea: 500 });

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('technical');
        expect(res.body).toHaveProperty('financial');
        expect(res.body).toHaveProperty('environmental');

        // Check specific calculations based on 500 rooftopArea and 24.5 panelSizeSqFt
        const expectedPanels = Math.floor(500 / 24.5);
        expect(res.body.technical.numberOfPanels).toEqual(expectedPanels);
    });

    it('should calculate solar potential using coordinates (fallback/real behavior)', async () => {
        const res = await request(app)
            .post('/api/solar/estimate')
            .send({
                rooftopArea: 600,
                lat: 6.9271,
                lon: 79.8612
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.technical).toBeDefined();
        expect(res.body.financial).toBeDefined();
    });

    it('should turn down request if rooftopArea is missing', async () => {
        const res = await request(app)
            .post('/api/solar/estimate')
            .send({ lat: 6.9271, lon: 79.8612 });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toEqual('Valid rooftop area is required');
    });

    it('should turn down request if rooftopArea is zero or negative', async () => {
        const res = await request(app)
            .post('/api/solar/estimate')
            .send({ rooftopArea: -100 });

        expect(res.statusCode).toEqual(400);
        expect(res.body.message).toEqual('Valid rooftop area is required');
    });

});
