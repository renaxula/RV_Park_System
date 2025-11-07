import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import App from '../../App';
import { AdminDashboard } from '../pages/AdminDashboard';
import { AvailableSpots } from '../pages/AvailableSpots';
import { ChangePassword } from '../pages/ChangePassword';
import { ChangeRates } from '../pages/ChangeRates';
import { ElevateDemote } from '../pages/ElevateDemote';
import { EmployeeReservation } from '../pages/EmployeeReservation';
import { MakeReservation } from '../pages/MakeReservation';
import { MapAndRules } from '../pages/MapAndRules';
import { OccupiedSitesReport } from '../pages/OccupiedSitesReport';
import { OpenSitesReport } from '../pages/OpenSitesReport';
import { Register } from '../pages/Register';
import { ResetPassword } from '../pages/ResetPassword';
import { ViewReservations } from '../pages/ViewReservations';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <header style={{ padding: 8 }}>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/admin">Admin</Link></li>
            <li><Link to="/available-spots">Available Spots</Link></li>
            <li><Link to="/make-reservation">Make Reservation</Link></li>
            <li><Link to="/employee-reservation">Employee Reservation</Link></li>
            <li><Link to="/view-reservations">View Reservations</Link></li>
            <li><Link to="/change-rates">Change Rates</Link></li>
            <li><Link to="/change-password">Change Password</Link></li>
            <li><Link to="/reset-password">Reset Password</Link></li>
            <li><Link to="/register">Register</Link></li>
            <li><Link to="/elevate-demote">Elevate/Demote</Link></li>
            <li><Link to="/map-and-rules">Map & Rules</Link></li>
            <li><Link to="/occupied-report">Occupied Report</Link></li>
            <li><Link to="/open-report">Open Report</Link></li>
          </ul>
        </nav>
      </header>

      <main style={{ padding: 12 }}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/available-spots" element={<AvailableSpots />} />
          <Route path="/change-rates" element={<ChangeRates />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/elevate-demote" element={<ElevateDemote />} />
          <Route path="/employee-reservation" element={<EmployeeReservation />} />
          <Route path="/make-reservation" element={<MakeReservation />} />
          <Route path="/map-and-rules" element={<MapAndRules />} />
          <Route path="/occupied-report" element={<OccupiedSitesReport />} />
          <Route path="/open-report" element={<OpenSitesReport />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/view-reservations" element={<ViewReservations />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}