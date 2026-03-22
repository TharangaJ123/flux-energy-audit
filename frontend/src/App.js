import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CostManagement from './pages/CostManagement';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cost-management" element={<CostManagement />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/login" element={<UserManagement />} />
        <Route path="/register" element={<UserManagement />} />
      </Routes>
    </Router>
  );
}

export default App;