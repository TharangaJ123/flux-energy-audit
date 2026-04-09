// Smoke tests that verify top-level routing renders the expected page shells.
jest.mock('../pages/Home', () => () => <div>Home Page</div>);
jest.mock('../pages/CostManagement', () => () => <div>Cost Management Page</div>);
jest.mock('../pages/UserManagement', () => () => <div>User Management Page</div>);
jest.mock('../pages/ApplianceManagement', () => () => <div>Appliance Management Page</div>);
jest.mock('../pages/EnergyAuditManagement', () => () => <div>Energy Audit Page</div>);
jest.mock('../pages/CarbonTracker', () => () => <div>Carbon Tracker Page</div>);

import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App routing', () => {
  test('renders the home route', () => {
    window.history.pushState({}, '', '/');
    render(<App />);

    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });

  test('renders the cost management route', () => {
    window.history.pushState({}, '', '/cost-management');
    render(<App />);

    expect(screen.getByText('Cost Management Page')).toBeInTheDocument();
  });
});
