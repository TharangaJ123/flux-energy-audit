import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import EnergyAuditManagement from '../pages/EnergyAuditManagement';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('../test-utils/reactRouterDomMock');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
}, { virtual: true });

jest.mock('../services/api', () => ({
    energyAuditApi: {
        getAudits: jest.fn(),
        createAudit: jest.fn(),
        updateAudit: jest.fn(),
        deleteAudit: jest.fn(),
        chatWithAudit: jest.fn(),
        simulateChange: jest.fn(),
    },
    applianceApi: {
        getAppliances: jest.fn(),
    }
}));

const { energyAuditApi, applianceApi } = require('../services/api');

describe('EnergyAuditManagement', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // Default mock returns
        energyAuditApi.getAudits.mockResolvedValue({ data: [] });
        applianceApi.getAppliances.mockResolvedValue({
            data: {
                data: [
                    { _id: 'a1', name: 'Refrigerator', powerConsumption: 150 },
                    { _id: 'a2', name: 'TV', powerConsumption: 100 }
                ]
            }
        });

        Object.defineProperty(window, 'speechSynthesis', {
            value: {
                cancel: jest.fn(),
                speak: jest.fn(),
            },
            writable: true
        });
    });

    test('renders the initial view correctly', async () => {
        render(
            <MemoryRouter>
                <EnergyAuditManagement />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Begin Discovery/i)).toBeInTheDocument();
        });
    });

    test('opens manual form on clicking analyze now, and can submit an audit', async () => {
        energyAuditApi.getAudits.mockResolvedValueOnce({ data: [] });
        energyAuditApi.createAudit.mockResolvedValueOnce({
            data: {
                _id: 'audit-1',
                month: '2026-04',
                totalUnits: 150,
                householdSize: 2,
                peakUsage: 'Day',
                efficiencyScore: 85,
                aiSummary: 'Good efficiency.',
                badges: [],
                aiRecommendations: [],
                appliances: []
            }
        });

        render(
            <MemoryRouter>
                <EnergyAuditManagement />
            </MemoryRouter>
        );

        // Wait for initial render
        await waitFor(() => {
            expect(screen.getByText(/Begin Discovery/i)).toBeInTheDocument();
        });

        // Click Analyze now (or manual discovery button)
        const analyzeButton = screen.getByRole('button', { name: /Analyze now/i });
        fireEvent.click(analyzeButton);

        // Wait for the form to open
        await waitFor(() => {
            expect(screen.getByText(/Pulse Discovery/i)).toBeInTheDocument();
        });

        // Find the inputs and submit button
        const submitBtn = screen.getByRole('button', { name: /Start Audit/i });
        const container = submitBtn.closest('form');
        const inputs = container.querySelectorAll('input[type="number"]');

        // Fill totalUnits input
        fireEvent.change(inputs[0], { target: { value: '150' } });
        // Fill householdSize input
        fireEvent.change(inputs[1], { target: { value: '2' } });

        // Select appliances
        const fridgeAppliance = await screen.findByText('Refrigerator');
        fireEvent.click(fridgeAppliance);

        // Submit form
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(energyAuditApi.createAudit).toHaveBeenCalledWith(expect.objectContaining({
                totalUnits: 150,
                householdSize: 2,
                peakUsage: 'Day',
                appliances: expect.arrayContaining([expect.objectContaining({ applianceId: 'a1' })])
            }));
        });
    });

    test('displays existing audits from the API', async () => {
        energyAuditApi.getAudits.mockResolvedValueOnce({
            data: [
                {
                    _id: 'audit-1',
                    month: '2026-03',
                    createdAt: new Date().toISOString(),
                    totalUnits: 200,
                    householdSize: 3,
                    efficiencyScore: 75,
                    aiSummary: 'Test Summary',
                    badges: [],
                    appliances: []
                }
            ]
        });

        render(
            <MemoryRouter>
                <EnergyAuditManagement />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('200')).toBeInTheDocument(); // totalUnits
            expect(screen.getByText('75%')).toBeInTheDocument();   // efficiencyScore
            expect(screen.getByText(/"Test Summary"/i)).toBeInTheDocument();
        });
    });
});
