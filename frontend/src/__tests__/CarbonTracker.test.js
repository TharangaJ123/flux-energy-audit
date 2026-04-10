import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CarbonTracker from '../pages/CarbonTracker';
import carbonService from '../services/carbonFootprint.service';

// Mock the service
jest.mock('../services/carbonFootprint.service');

// Mock Recharts to avoid DOM issues with ResponsiveContainer
jest.mock('recharts', () => {
  const OriginalRecharts = jest.requireActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }) => <div style={{ width: '800px', height: '400px' }}>{children}</div>,
  };
});

// Mock Layout component if necessary (or just let it render)
jest.mock('../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('CarbonTracker Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders header and fetch records', async () => {
    carbonService.getRecords.mockResolvedValue([
      { _id: '1', month: '1', year: 2024, co2Emission: 100, status: 'Moderate', electricity: 50, gasData: { amounts: {} }, transportData: { distances: {} } }
    ]);

    renderWithRouter(<CarbonTracker />);

    expect(screen.getByText(/Carbon Footprint Tracker/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText(/100.0/)).toBeInTheDocument();
      expect(screen.getByText(/Moderate/i)).toBeInTheDocument();
    });
  });

  test('shows empty state when no records', async () => {
    carbonService.getRecords.mockResolvedValue([]);

    renderWithRouter(<CarbonTracker />);

    await waitFor(() => {
      expect(screen.getByText(/No Carbon Data/i)).toBeInTheDocument();
    });
  });

  test('opens and submits form', async () => {
    carbonService.getRecords.mockResolvedValue([]);
    carbonService.createRecord.mockResolvedValue({ _id: '2', month: '2', year: 2024, co2Emission: 50 });

    renderWithRouter(<CarbonTracker />);

    const addButton = screen.getByText(/Calculate Footprint/i);
    fireEvent.click(addButton);

    expect(screen.getByText(/New Footprint Record/i)).toBeInTheDocument();

    const electricityInput = screen.getByPlaceholderText('0'); // This identifies electricity in my version
    fireEvent.change(electricityInput, { target: { value: '100' } });

    const submitButton = screen.getByText(/Analyze & Save/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(carbonService.createRecord).toHaveBeenCalled();
    });
  });

  test('switches tabs', async () => {
    carbonService.getRecords.mockResolvedValue([]);
    renderWithRouter(<CarbonTracker />);

    const trendTab = screen.getByText(/Trend Graph/i);
    fireEvent.click(trendTab);

    expect(screen.getByText(/Emissions Trend/i)).toBeInTheDocument();

    const breakdownTab = screen.getByText(/Breakdown Graph/i);
    fireEvent.click(breakdownTab);

    expect(screen.queryByText(/Emissions Trend/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Emissions Distribution/i)).toBeInTheDocument();
  });
});
