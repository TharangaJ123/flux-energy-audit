import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CostManagement from './pages/CostManagement';
import UserManagement from './pages/UserManagement';
import ApplianceManagement from './pages/ApplianceManagement';
import EnergyAuditManagement from './pages/EnergyAuditManagement';

import CarbonTracker from './pages/CarbonTracker';
import SolarEstimator from './pages/SolarEstimator';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cost-management" element={<CostManagement />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/carbon-tracker" element={<CarbonTracker />} />
        <Route path="/appliance-management" element={<ApplianceManagement />} />
        <Route path="/energy-audit" element={<EnergyAuditManagement />} />
        <Route path="/solar-estimator" element={<SolarEstimator />} />
        <Route path="/login" element={<UserManagement />} />
        <Route path="/register" element={<UserManagement />} />
      </Routes>
    </Router>
  );
}

export default App;