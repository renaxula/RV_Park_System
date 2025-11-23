import { useState } from "react";
import { Card } from "../ui/Card";

const API_BASE =
  import.meta?.env?.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export function ResetPassword() {
  const [account, setAccount] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/admin/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset password");
      setMessage(`Temporary password set for ${data.user.username}`);
      setAccount("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <h2>Admin: Set a Temporary Password</h2>
      <p>Enter a username or email to set a new temporary password for that account.</p>
      <form onSubmit={handleSubmit}>
        <label>
          Account Email or Username:
          <input
            type="text"
            name="account"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          New Temporary Password:
          <input
            type="password"
            name="newPassword"
            value={newPassword}
            minLength={8}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Confirm New Password:
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            minLength={8}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </label>
        <br />
        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Setting password..." : "Reset Password"}
        </button>
      </form>
    </Card>
  );
}
