/**
 * App Component
 * Root component of the Flux Energy Audit application.
 * Defines the main routing table and view hierarchy using React Router.
 *
 * Route overview:
 *  /                    → Landing page with feature overview
 *  /cost-management     → Electricity bill tracking and analytics
 *  /user-management     → User profile, login, and registration views
 *  /carbon-tracker      → Monthly CO₂ emissions calculator
 *  /appliance-management→ Household appliance registry and energy audit
 *  /energy-audit        → AI-powered monthly energy audit
 *  /solar-estimator     → Rooftop solar ROI calculator
 *  /documentation       → API and usage documentation
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CostManagement from './pages/CostManagement';
import UserManagement from './pages/UserManagement';
import ApplianceManagement from './pages/ApplianceManagement';
import EnergyAuditManagement from './pages/EnergyAuditManagement';

import CarbonTracker from './pages/CarbonTracker';
import SolarEstimator from './pages/SolarEstimator';
import Documentation from './pages/Documentation';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public landing page */}
        <Route path="/" element={<Home />} />
        {/* Feature pages — authentication is enforced client-side by each page */}
        <Route path="/cost-management" element={<CostManagement />} />
        {/* /login and /register share the UserManagement page which renders the correct tab */}
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/carbon-tracker" element={<CarbonTracker />} />
        <Route path="/appliance-management" element={<ApplianceManagement />} />
        <Route path="/energy-audit" element={<EnergyAuditManagement />} />
        <Route path="/solar-estimator" element={<SolarEstimator />} />
        <Route path="/login" element={<UserManagement />} />
        <Route path="/register" element={<UserManagement />} />
        <Route path="/documentation" element={<Documentation />} />
      </Routes>
    </Router>
  );
}

export default App;
