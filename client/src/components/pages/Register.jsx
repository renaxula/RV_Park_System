
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { useAuth } from "../router/AuthContext";

export function Register() {
  const navigate = useNavigate();
  const { register, setError, error, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: "", username: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Card><p>You are already signed in.</p></Card>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register(form);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <Card>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Email
          <input type="email" value={form.email} onChange={handleChange("email")} required />
        </label>
        <label>
          Username
          <input type="text" value={form.username} onChange={handleChange("username")} required />
        </label>
        <label>
          Password (min 8 chars)
          <input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            minLength={8}
            required
          />
        </label>
        <label>
          Confirm Password
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </label>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Creating account..." : "Register"}
        </button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </Card>
  );
}
