import { Card } from "../ui/Card";
import { Link } from "react-router-dom";

export function AdminDashboard() {
  return (
    <Card>
      <h2>Admin Dashboard</h2>
      <ul>
        <li>
          <Link to="/reset-password">Reset Passwords</Link>
        </li>
        <li>
          <Link to="/elevate-demote">Elevate / Demote Accounts</Link>
        </li>
        <li>
          <Link to="/open-report">View Open Sites Report</Link>
        </li>
        <li>
          <Link to="/occupied-report">View Occupied Sites Report</Link>
        </li>
        <li>
          <Link to="/change-rates">Change Site Rates</Link>
        </li>
      </ul>
    </Card>
  );
}
