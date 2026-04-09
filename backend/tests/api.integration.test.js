// Route-level integration tests that exercise the Express app with mocked auth and services.
jest.mock('../src/middleware/auth', () => {
    const { attachMockUser } = require('./helpers/mockAuth');
    return { protect: attachMockUser, authorize: () => attachMockUser };
});

jest.mock('../src/middleware/upload', () => ({
    handleBillUpload: (req, _res, next) => next(),
}));

jest.mock('../src/services/userManagement.service', () => ({
    registerUser: jest.fn(),
    loginUser: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteUserProfile: jest.fn(),
}));

jest.mock('../src/services/costManagement.service', () => ({
    createCost: jest.fn(),
    getCosts: jest.fn(),
    getCostById: jest.fn(),
    updateCost: jest.fn(),
    deleteCost: jest.fn(),
    estimateCostByTariff: jest.fn(),
    getAIInsights: jest.fn(),
}));

jest.mock('../src/services/costGoal.service', () => ({
    createGoal: jest.fn(),
    getGoals: jest.fn(),
    getGoalById: jest.fn(),
    updateGoal: jest.fn(),
    deleteGoal: jest.fn(),
}));

jest.mock('../src/services/fileScan.service', () => ({
    enqueueFileScan: jest.fn(),
}));

const request = require('supertest');
const createApp = require('../src/app');
const userService = require('../src/services/userManagement.service');
const costService = require('../src/services/costManagement.service');
const goalService = require('../src/services/costGoal.service');

describe('API integration', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = createApp();
    });

    test('POST /api/users/register returns created user', async () => {
        userService.registerUser.mockResolvedValue({
            id: 'user-1',
            name: 'Alice',
            email: 'alice@example.com',
        });

        const response = await request(app).post('/api/users/register').send({
            name: 'Alice',
            email: 'alice@example.com',
            password: 'secret123',
        });

        expect(response.status).toBe(201);
        expect(response.body.email).toBe('alice@example.com');
    });

    test('POST /api/costs/estimate returns estimated bill payload', async () => {
        costService.estimateCostByTariff.mockResolvedValue({
            estimatedBill: 5230,
            source: 'local',
            breakdown: [],
        });

        const response = await request(app)
            .post('/api/costs/estimate')
            .set('Authorization', 'Bearer test-token')
            .send({ units: 120, month: 4, year: 2026, provider: 'CEB' });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(expect.objectContaining({
            estimatedBill: 5230,
            source: 'local',
        }));
    });

    test('GET /api/costs/ai-insights returns adviser response', async () => {
        costService.getAIInsights.mockResolvedValue({
            summary: 'Average spend is improving.',
            recommendations: ['Watch electricity peaks.'],
            status: 'warning',
            highlight_category: 'electricity',
        });

        const response = await request(app)
            .get('/api/costs/ai-insights')
            .set('Authorization', 'Bearer test-token');

        expect(response.status).toBe(200);
        expect(response.body.highlight_category).toBe('electricity');
    });

    test('POST /api/costs/goals validates and creates a goal', async () => {
        goalService.createGoal.mockResolvedValue({
            _id: 'goal-1',
            type: 'monthly',
            month: 4,
            year: 2026,
            goalAmount: 4000,
        });

        const response = await request(app)
            .post('/api/costs/goals')
            .set('Authorization', 'Bearer test-token')
            .send({ type: 'monthly', month: 4, year: 2026, goalAmount: 4000 });

        expect(response.status).toBe(201);
        expect(response.body._id).toBe('goal-1');
    });
});
