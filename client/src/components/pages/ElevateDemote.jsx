import { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import styled from "styled-components";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export function ElevateDemote() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/admin/users`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update role");

      setMessage(`Role updated for ${data.user.emailaddress} to ${newRole}`);
      // Update local state
      setUsers(users.map(u => 
        u.userid === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin": return "#dc3545";
      case "employee": return "#0d6efd";
      default: return "#6c757d";
    }
  };

  if (loading) return <Card><p>Loading users...</p></Card>;

  return (
    <Card>
      <h2>Elevate / Demote Accounts</h2>
      <p>Manage user roles. Select a new role from the dropdown to change a user's permissions.</p>
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {message && <SuccessMessage>{message}</SuccessMessage>}

      <UsersTable>
        <thead>
          <tr>
            <th>Email</th>
            <th>Name</th>
            <th>Current Role</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.userid}>
              <td>{user.emailaddress}</td>
              <td>{user.firstname} {user.lastname}</td>
              <td>
                <RoleBadge color={getRoleBadgeColor(user.role)}>
                  {user.role}
                </RoleBadge>
              </td>
              <td>
                <RoleSelect
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.userid, e.target.value)}
                  disabled={updatingUserId === user.userid}
                >
                  <option value="customer">Customer</option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </RoleSelect>
                {updatingUserId === user.userid && <span> Updating...</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </UsersTable>
    </Card>
  );
}

const UsersTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;

  th, td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #dee2e6;
  }

  th {
    background-color: #f8f9fa;
    font-weight: 600;
  }

  tr:hover {
    background-color: #f8f9fa;
  }
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background-color: ${props => props.color};
  color: white;
  font-size: 0.85rem;
  font-weight: 500;
  text-transform: capitalize;
`;

const RoleSelect = styled.select`
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;

const SuccessMessage = styled.p`
  color: #155724;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
`;
