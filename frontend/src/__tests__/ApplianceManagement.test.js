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

// Mock Layout
jest.mock('../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);

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
    
    const cancelButton = screen.getByText(/Cancel Pulse/i);
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
        powerConsumption: 200,
        usageHours: 24
      }));
    });
  });

  test('deletes an appliance', async () => {
    applianceApi.getAppliances.mockResolvedValue({ 
      data: { data: [{ _id: '1', name: 'Toaster', powerConsumption: 800, usageHours: 1, category: 'Kitchen' }] } 
    });
    
    renderWithRouter(<ApplianceManagement />);
    
    await waitFor(() => {
      expect(screen.getByText('Toaster')).toBeInTheDocument();
    });
    
    const deleteButton = screen.getByRole('button', { name: /delete/i }); // Assuming there's a title or icon that RTL can find, or check by SVG path if needed. 
    // In the component, it's an icon button. Let's find by role if possible, or just click the first button in the card actions.
    
    const buttons = screen.getAllByRole('button');
    const deleteBtn = buttons.find(b => b.innerHTML.includes('M19 7l-.867 12.142')); // Quick hack to find the delete icon button
    
    fireEvent.click(deleteBtn);
    
    await waitFor(() => {
      expect(applianceApi.deleteAppliance).toHaveBeenCalledWith('1');
    });
  });
});
