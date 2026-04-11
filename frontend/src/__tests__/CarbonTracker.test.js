import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CarbonTracker from '../pages/CarbonTracker';
import carbonService from '../services/carbonFootprint.service';

// Mock the service
jest.mock('../services/carbonFootprint.service');

// Mock Recharts to avoid DOM and dimension issues in JSDOM
jest.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
    LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
    AreaChart: ({ children }) => <div data-testid="area-chart">{children}</div>,
    BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
    PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
    XAxis: () => <div />,
    YAxis: () => <div />,
    CartesianGrid: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />,
    Line: () => <div />,
    Area: () => <div />,
    Bar: () => <div />,
    Cell: () => <div />,
    Pie: () => <div />,
  };
});

// Mock Layout component 
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
      // Use querySelector or more specific match for the value
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

    // Electricity is the first '0' placeholder
    const placeholders = screen.getAllByPlaceholderText('0');
    fireEvent.change(placeholders[0], { target: { value: '100' } });

    const submitButton = screen.getByText(/Analyze & Save/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(carbonService.createRecord).toHaveBeenCalled();
    });
  });

  test('switches tabs', async () => {
    const mockRecords = [
        { _id: '1', month: '1', year: 2024, co2Emission: 100, status: 'Moderate', electricity: 50, gasData: { amounts: {} }, transportData: { distances: {} } }
    ];
    carbonService.getRecords.mockResolvedValue(mockRecords);
    renderWithRouter(<CarbonTracker />);

    // Wait for initial load
    await screen.findByText(/100.0/);

    const trendTab = screen.getByText(/Trend Graph/i);
    fireEvent.click(trendTab);

    // Header outside the chart
    expect(await screen.findByText(/Emissions Trend/i)).toBeInTheDocument();

    const breakdownTab = screen.getByText(/Breakdown Graph/i);
    fireEvent.click(breakdownTab);

    // Wait for the trend header to disappear and the distribution header to appear
    await waitFor(() => {
        expect(screen.queryByText(/Emissions Trend/i)).not.toBeInTheDocument();
        expect(screen.getByText(/Emissions Distribution/i)).toBeInTheDocument();
    });
  });
});
