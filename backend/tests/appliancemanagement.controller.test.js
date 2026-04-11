// Unit tests for appliance controller
jest.mock('../src/services/appliancemanagement.service', () => ({
    addAppliance: jest.fn(),
    getAppliancesByUser: jest.fn(),
    getApplianceById: jest.fn(),
    updateAppliance: jest.fn(),
    deleteAppliance: jest.fn(),
    getTotalEnergyConsumption: jest.fn(),
    getApplianceStats: jest.fn(),
}));

const applianceController = require('../src/controllers/appliancemanagement.controller');
const applianceService = require('../src/services/appliancemanagement.service');

const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('appliancemanagement.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createAppliance', () => {
        test('returns 201 when service succeeds', async () => {
            const req = {
                user: { id: 'user-1' },
                body: { name: 'Fan', powerConsumption: 75, usageHours: 8 },
            };
            const res = createRes();
            applianceService.addAppliance.mockResolvedValue({ id: 'app-1', name: 'Fan' });

            await applianceController.createAppliance(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Appliance added successfully',
                data: { id: 'app-1', name: 'Fan' },
            });
        });

        test('returns 400 when validation fails', async () => {
            const req = { body: { name: '' }, user: { id: 'user-1' } }; // Missing consumed power
            const res = createRes();

            await applianceController.createAppliance(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.any(String)
            }));
        });

        test('returns 500 when service throws error', async () => {
            const req = { user: { id: 'user-1' }, body: { name: 'Fan', powerConsumption: 75, usageHours: 8 } };
            const res = createRes();
            applianceService.addAppliance.mockRejectedValue(new Error('DB Error'));

            await applianceController.createAppliance(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getAllAppliances', () => {
        test('returns 200 with all appliances', async () => {
            const req = { user: { id: 'user-1' } };
            const res = createRes();
            const mockData = [{ name: 'App 1' }];
            applianceService.getAppliancesByUser.mockResolvedValue(mockData);

            await applianceController.getAllAppliances(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Appliances retrieved successfully',
                results: 1,
                data: mockData,
            });
        });
    });

    describe('getAppliance', () => {
        test('returns 200 when appliance exists', async () => {
            const req = { params: { id: 'app-1' }, user: { id: 'user-1' } };
            const res = createRes();
            const mockApp = { name: 'App 1' };
            applianceService.getApplianceById.mockResolvedValue(mockApp);

            await applianceController.getAppliance(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Appliance retrieved successfully',
                data: mockApp,
            });
        });

        test('returns 404 when appliance missing', async () => {
            const req = { params: { id: 'missing' }, user: { id: 'user-1' } };
            const res = createRes();
            applianceService.getApplianceById.mockResolvedValue(null);

            await applianceController.getAppliance(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('updateAppliance', () => {
        test('returns 200 when update successful', async () => {
            const req = { params: { id: 'app-1' }, body: { name: 'Updated' }, user: { id: 'user-1' } };
            const res = createRes();
            applianceService.updateAppliance.mockResolvedValue({ name: 'Updated' });

            await applianceController.updateAppliance(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Appliance updated successfully'
            }));
        });
    });

    describe('deleteAppliance', () => {
        test('returns 200 when deleted', async () => {
            const req = { params: { id: 'app-1' }, user: { id: 'user-1' } };
            const res = createRes();
            applianceService.deleteAppliance.mockResolvedValue({ id: 'app-1' });

            await applianceController.deleteAppliance(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Appliance deleted successfully' });
        });
    });

    describe('getEnergyAudit', () => {
        test('returns 200 with report', async () => {
            const req = { query: { city: 'Colombo' }, user: { id: 'user-1' } };
            const res = createRes();
            const mockReport = { total: 100 };
            applianceService.getTotalEnergyConsumption.mockResolvedValue(mockReport);

            await applianceController.getEnergyAudit(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Energy audit retrieved successfully',
                data: mockReport,
            });
        });
    });

    describe('getApplianceStats', () => {
        test('returns 200 with stats', async () => {
            const req = { user: { id: 'user-1' } };
            const res = createRes();
            const mockStats = { count: 5 };
            applianceService.getApplianceStats.mockResolvedValue(mockStats);

            await applianceController.getApplianceStats(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Appliance statistics retrieved successfully',
                data: mockStats,
            });
        });
    });
});

