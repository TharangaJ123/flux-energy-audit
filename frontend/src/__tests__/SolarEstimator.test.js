import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SolarEstimator from '../pages/SolarEstimator';
import axios from 'axios';

jest.mock('axios');

// Mock Recharts to avoid ResizeObserver and responsive container issues in jsdom
jest.mock('recharts', () => {
    const OriginalRecharts = jest.requireActual('recharts');
    return {
        ...OriginalRecharts,
        ResponsiveContainer: ({ children }) => <div>{children}</div>,
    };
});

describe('SolarEstimator', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('renders without crashing', () => {
        render(
            <MemoryRouter>
                <SolarEstimator />
            </MemoryRouter>
        );
        expect(screen.getByRole('heading', { name: /Solar Potential Estimator/i })).toBeInTheDocument();
    });

    test('shows error when area is empty or invalid', async () => {
        render(
            <MemoryRouter>
                <SolarEstimator />
            </MemoryRouter>
        );

        const button = screen.getByRole('button', { name: /Generate Estimate/i });
        fireEvent.click(button);

        await waitFor(() => {
            expect(screen.getByText('Please enter a valid rooftop area.')).toBeInTheDocument();
        });
    });

    test('calls API and displays result upon successful calculation', async () => {
        const mockData = {
            data: {
                input: { rooftopArea: 500, lat: null, lon: null },
                technical: {
                    systemCapacityKWp: 5,
                    numberOfPanels: 10,
                    monthlyGenerationUnits: 600,
                    yearlyGenerationUnits: 7200,
                    isRealTimeData: false
                },
                financial: {
                    estimatedCostLKR: 1000000,
                    monthlySavingsLKR: 15000,
                    yearlySavingsLKR: 180000,
                    paybackPeriod: { years: 4, months: 2 }
                },
                environmental: {
                    carbonOffsetTonnesPerYearUnrounded: 3.5
                }
            }
        };
        axios.post.mockResolvedValueOnce(mockData);

        render(
            <MemoryRouter>
                <SolarEstimator />
            </MemoryRouter>
        );

        const input = screen.getByPlaceholderText(/e.g., 500/i);
        fireEvent.change(input, { target: { value: '500' } });

        const button = screen.getByRole('button', { name: /Generate Estimate/i });
        fireEvent.click(button);

        expect(button).toHaveTextContent(/Calculating.../i);

        await waitFor(() => {
            expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/solar/estimate', {
                rooftopArea: 500,
                lat: null,
                lon: null
            });
            // Verification that result values are shown
            expect(screen.getByText('System Size')).toBeInTheDocument();
            expect(screen.getByText('5')).toBeInTheDocument();
            expect(screen.getByText('Total Investment')).toBeInTheDocument();
        });
    });
});
