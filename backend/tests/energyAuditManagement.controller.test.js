/**
 * @file energyAuditManagement.controller.test.js
 * @description Unit tests for the Energy Audit Management controller.
 * Covers missing-field rejection for the AI chat endpoint and
 * 404 propagation when the service throws an `'Audit not found'` error.
 * The energy audit service is fully mocked.
 */
jest.mock('../src/services/energyAuditManagement.service', () => ({
    createAudit: jest.fn(),
    getAudits: jest.fn(),
    getAuditById: jest.fn(),
    updateAudit: jest.fn(),
    deleteAudit: jest.fn(),
    simulateChange: jest.fn(),
    chatWithAudit: jest.fn(),
}));

const energyAuditController = require('../src/controllers/energyAuditManagement.controller');
const energyAuditService = require('../src/services/energyAuditManagement.service');

const createRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

describe('energyAuditManagement.controller', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('chatWithAudit returns 400 when message is missing', async () => {
        const req = { params: { id: 'audit-1' }, user: { id: 'user-1' }, body: {} };
        const res = createRes();

        await energyAuditController.chatWithAudit(req, res);

        expect(energyAuditService.chatWithAudit).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('getAuditById returns 404 for missing audit', async () => {
        const req = { params: { id: 'missing' }, user: { id: 'user-1' } };
        const res = createRes();

        energyAuditService.getAuditById.mockRejectedValue(new Error('Audit not found'));

        await energyAuditController.getAuditById(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Audit not found' });
    });
});
