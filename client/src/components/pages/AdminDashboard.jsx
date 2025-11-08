import { Card } from "../ui/Card";


export function AdminDashboard() {
  return (
    <Card>
      <h2>Admin Dashboard</h2>
      <ul>
        <li>
          <a href="#/admin/reset-password">Reset Passwords</a>
        </li>
        <li>
          <a href="#/admin/elevate-demote">Elevate / Demote Accounts</a>
        </li>
        <li>
          <a href="#/reports/open-sites">View Open Sites Report</a>
        </li>
        <li>
          <a href="#/reports/occupied-sites">View Occupied Sites Report</a>
        </li>
        <li>
          <a href="#/admin/change-rates">Change Site Rates</a>
        </li>
      </ul>
    </Card>
  );
}
