// Unit tests for cost controller flows that normalize payloads and surface API responses.
jest.mock('../src/services/costManagement.service', () => ({
    createCost: jest.fn(),
    getCosts: jest.fn(),
    getCostById: jest.fn(),
    updateCost: jest.fn(),
    deleteCost: jest.fn(),
    estimateCostByTariff: jest.fn(),
    getAIInsights: jest.fn(),
}));

jest.mock('../src/services/fileScan.service', () => ({
    enqueueFileScan: jest.fn(),
}));

const costController = require('../src/controllers/costManagement.controller');
const costService = require('../src/services/costManagement.service');

const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.download = jest.fn().mockReturnValue(res);
    return res;
};

describe('costManagement.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('create returns 201 for valid payload', async () => {
        const req = {
            user: { _id: 'user-1' },
            body: { month: 4, year: 2026, electricityCost: 4500 },
        };
        const res = createRes();

        costService.createCost.mockResolvedValue({ id: 'cost-1', amount: 4500 });

        await costController.create(req, res);

        expect(costService.createCost).toHaveBeenCalledWith(
            'user-1',
            expect.objectContaining({ month: 4, year: 2026, amount: 4500 })
        );
        expect(res.status).toHaveBeenCalledWith(201);
    });

    test('estimate returns 400 for invalid provider payload', async () => {
        const req = {
            body: { units: 100, month: 4, provider: 'INVALID' },
        };
        const res = createRes();

        await costController.estimate(req, res);

        expect(costService.estimateCostByTariff).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('getAIInsights returns 200 with adviser payload', async () => {
        const req = { user: { _id: 'user-1' } };
        const res = createRes();
        const insights = {
            summary: 'Summary',
            recommendations: ['Tip 1'],
            status: 'on-track',
            highlight_category: 'electricity',
        };

        costService.getAIInsights.mockResolvedValue(insights);

        await costController.getAIInsights(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(insights);
    });
});
