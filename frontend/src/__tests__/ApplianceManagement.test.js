import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ApplianceManagement from '../pages/ApplianceManagement';
import { applianceApi } from '../services/api';

// Mock the API
jest.mock('../services/api', () => ({
  applianceApi: {
    getAppliances: jest.fn(),
    getApplianceStats: jest.fn(),
    getEnergyAudit: jest.fn(),
    createAppliance: jest.fn(),
    updateAppliance: jest.fn(),
    deleteAppliance: jest.fn(),
  }
}));

// Mock Recharts to avoid DOM and dimension issues in JSDOM
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => <div></div>,
  XAxis: () => <div></div>,
  YAxis: () => <div></div>,
  CartesianGrid: () => <div></div>,
  Tooltip: () => <div></div>,
}));

// Mock Layout
jest.mock('../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);

// Mock window.scrollTo
window.scrollTo = jest.fn();
// Mock window.confirm
window.confirm = jest.fn(() => true);

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('ApplianceManagement Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default success mocks
    applianceApi.getAppliances.mockResolvedValue({ data: { data: [] } });
    applianceApi.getApplianceStats.mockResolvedValue({ data: { data: { totalAppliances: 0, categoryBreakdown: {} } } });
    applianceApi.getEnergyAudit.mockResolvedValue({ data: { data: { dailyTotalKWh: 0, monthlyTotalKWh: 0, weatherInsights: {}, appliances: [] } } });
  });

  test('renders page elements and transitions tabs', async () => {
    renderWithRouter(<ApplianceManagement />);
    
    expect(screen.getByText(/Device Pulse Center/i)).toBeInTheDocument();
    
    const statsTab = screen.getByText(/Consumption Stats/i);
    fireEvent.click(statsTab);
    
    await waitFor(() => {
      expect(screen.getByText(/Pulse Optimization/i)).toBeInTheDocument();
    });

    const auditTab = screen.getByText(/Audit Dashboard/i);
    fireEvent.click(auditTab);

    await waitFor(() => {
        expect(screen.getByText(/Pulse Consumption Audit/i)).toBeInTheDocument();
    });
  });

  test('shows and hides add appliance form', async () => {
    renderWithRouter(<ApplianceManagement />);
    
    const addButton = screen.getByText(/\+ Add New Device/i);
    fireEvent.click(addButton);
    
    expect(screen.getByText(/Record New Device Pulse/i)).toBeInTheDocument();
    
    const cancelButton = screen.getByText(/Close/i);
    fireEvent.click(cancelButton);
    
    expect(screen.queryByText(/Record New Device Pulse/i)).not.toBeInTheDocument();
  });

  test('submits new appliance', async () => {
    applianceApi.createAppliance.mockResolvedValue({ data: { message: 'Success' } });
    renderWithRouter(<ApplianceManagement />);
    
    fireEvent.click(screen.getByText(/\+ Add New Device/i));
    
    fireEvent.change(screen.getByPlaceholderText(/e.g. Inverter AC Unit/i), { target: { value: 'Fridge' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. 1500/i), { target: { value: '200' } });
    fireEvent.change(screen.getByPlaceholderText(/e.g. 8.5/i), { target: { value: '24' } });
    
    const submitButton = screen.getByText(/Record Pulse/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(applianceApi.createAppliance).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Fridge',
        powerConsumption: '200',
        usageHours: '24'
      }));
    });
  });

  test('edits and deletes an appliance', async () => {
    const mockAppliance = { _id: '123', name: 'Inverter AC', powerConsumption: 1500, usageHours: 8, category: 'General' };
    applianceApi.getAppliances.mockResolvedValue({ data: { data: [mockAppliance] } });
    applianceApi.deleteAppliance.mockResolvedValue({ data: { message: 'Success' } });

    renderWithRouter(<ApplianceManagement />);
    
    // Find the appliance and click edit
    const editButton = await screen.findByLabelText(/Edit appliance/i);
    fireEvent.click(editButton);
    expect(screen.getByText(/Edit Pulse Record/i)).toBeInTheDocument();

    // Click delete
    const deleteButton = screen.getByLabelText(/Delete appliance/i);
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(applianceApi.deleteAppliance).toHaveBeenCalledWith('123');
    });
  });
});
