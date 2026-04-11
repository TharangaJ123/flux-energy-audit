import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CostManagement from '../pages/CostManagement';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => {
    const actual = jest.requireActual('../test-utils/reactRouterDomMock');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
}, { virtual: true });

jest.mock('../services/api', () => ({
    costApi: {
        getCosts: jest.fn(),
        getGoals: jest.fn(),
        getAIInsights: jest.fn(),
        createCost: jest.fn(),
        updateCost: jest.fn(),
        deleteCost: jest.fn(),
        createGoal: jest.fn(),
        updateGoal: jest.fn(),
        deleteGoal: jest.fn(),
        estimateCost: jest.fn(),
        downloadCostDocument: jest.fn()
    }
}));

// Mock Recharts
jest.mock('recharts', () => {
    const OriginalRecharts = jest.requireActual('recharts');
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }) => <div>{children}</div>,
        PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
        Pie: () => <div />,
        BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
        Bar: () => <div />,
        XAxis: () => <div />,
        YAxis: () => <div />
    };
});

const { costApi } = require('../services/api');

describe('CostManagement', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        costApi.getCosts.mockResolvedValue({
            data: [
                { _id: 'cost-1', year: 2026, month: 3, utilityType: 'electricity', amount: 5000, notes: '' },
                { _id: 'cost-2', year: 2026, month: 2, utilityType: 'water', amount: 1500, notes: '' }
            ]
        });

        costApi.getGoals.mockResolvedValue({
            data: [
                { _id: 'goal-1', type: 'monthly', year: 2026, month: 3, utilityType: 'electricity', goalAmount: 4000 }
            ]
        });

        costApi.getAIInsights.mockResolvedValue({
            data: {
                summary: 'Your spending is slightly above average.',
                recommendations: ['Reduce electricity usage during peak hours']
            }
        });

        window.URL.createObjectURL = jest.fn();
        window.URL.revokeObjectURL = jest.fn();
    });

    test('renders the Dashboard tab initially', () => {
        render(
            <MemoryRouter>
                <CostManagement />
            </MemoryRouter>
        );

        // Initial load wait
        expect(screen.getByRole('heading', { name: /Cost Management/i })).toBeInTheDocument();
    });

    test('switches to My Costs tab and displays costs', async () => {
        render(
            <MemoryRouter>
                <CostManagement />
            </MemoryRouter>
        );

        const billsTab = screen.getByRole('button', { name: /My Costs/i });
        fireEvent.click(billsTab);

        await waitFor(() => {
            expect(costApi.getCosts).toHaveBeenCalled();
        });

        await waitFor(() => {
            // The component should display existing costs formatted
            expect(screen.getByText(/5,000\.00/i)).toBeInTheDocument();
            expect(screen.getByText(/1,500\.00/i)).toBeInTheDocument();
        });
    });

    test('opens add cost form and submits a new cost record', async () => {
        costApi.createCost.mockResolvedValueOnce({ data: { success: true } });

        render(
            <MemoryRouter>
                <CostManagement />
            </MemoryRouter>
        );

        // Switch to Bills tab
        const billsTab = screen.getByRole('button', { name: /My Costs/i });
        fireEvent.click(billsTab);

        // Click `Log Bill` action
        const logButton = await screen.findByRole('button', { name: /Log Bill/i });
        fireEvent.click(logButton);

        // Form should appear
        await waitFor(() => {
            expect(screen.getByText(/amount/i)).toBeInTheDocument();
        });

        // Query amount input
        const amountInput = screen.getByPlaceholderText(/0\.00/i);
        fireEvent.change(amountInput, { target: { value: '2500' } });

        // Click Save Button
        const saveButton = screen.getByRole('button', { name: /Save Record/i });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(costApi.createCost).toHaveBeenCalled();
        });
    });
});
