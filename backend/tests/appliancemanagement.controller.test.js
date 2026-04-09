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

    test('createAppliance returns 201 when service succeeds', async () => {
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

    test('getAppliance returns 404 when appliance does not exist', async () => {
        const req = { params: { id: 'missing' }, user: { id: 'user-1' } };
        const res = createRes();

        applianceService.getApplianceById.mockResolvedValue(null);

        await applianceController.getAppliance(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Appliance not found' });
    });
});
