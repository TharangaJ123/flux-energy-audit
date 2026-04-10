import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../pages/Home';

// Mock Layout
jest.mock('../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);

const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Home Page', () => {
  test('renders landing page content', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByText(/Smart Energy Audit/i)).toBeInTheDocument();
    expect(screen.getByText(/Take control of your home energy/i)).toBeInTheDocument();
    expect(screen.getByText(/Get Started/i)).toBeInTheDocument();
  });

  test('renders feature sections', () => {
    renderWithRouter(<Home />);
    
    expect(screen.getByText(/Appliance Management/i)).toBeInTheDocument();
    expect(screen.getByText(/Carbon Footprint/i)).toBeInTheDocument();
    expect(screen.getByText(/Cost Management|Cost Analysis/i)).toBeInTheDocument();
  });
});
