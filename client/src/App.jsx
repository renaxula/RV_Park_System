import "./App.css";
import { Link } from "react-router-dom";
import { Card } from "./components/ui/Card";
import { useAuth } from "./components/router/AuthContext";
import styled from "styled-components";

const quickLinks = [
  { label: "Make a Reservation", path: "/make-reservation", requiredRole: "customer" },
  { label: "View Reservations", path: "/view-reservations", requiredRole: "customer" },
  { label: "Available Spots", path: "/available-spots", requiredRole: "customer" },
  { label: "Open Sites Report", path: "/open-report", requiredRole: "customer" },
  { label: "Map & Rules", path: "/map-and-rules", requiredRole: "customer" },
  { label: "Register", path: "/register", requiredRole: "customer" },
  { label: "Reset Password", path: "/reset-password", requiredRole: "admin" },
  { label: "Change Password", path: "/change-password", requiredRole: "customer" },
  { label: "Employee Reservation", path: "/employee-reservation", requiredRole: "employee" },
  { label: "Occupied Sites Report", path: "/occupied-report", requiredRole: "employee" },
  { label: "Admin Dashboard", path: "/admin", requiredRole: "admin" },
  { label: "Elevate/Demote", path: "/elevate-demote", requiredRole: "admin" },
  { label: "Change Rates", path: "/change-rates", requiredRole: "admin" },
];

function App() {
  const { user, hasRole } = useAuth();
  const availableLinks = quickLinks.filter((link) => hasRole(link.requiredRole));

  return (
    <>
      <Card>
        <h3>Actions available to you</h3>
        {user ? (
          <>
            <ul>
              {availableLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path}>{link.label}</Link>
                </li>
              ))}
            </ul>
            <p>
              Employees inherit all customer abilities and add operational tools. Admins inherit all
              employee abilities plus rate changes and user management.
            </p>
          </>
        ) : (
          <p>Please login to see available actions.</p>
        )}
      </Card>
    </>
  );
}



export default App;
