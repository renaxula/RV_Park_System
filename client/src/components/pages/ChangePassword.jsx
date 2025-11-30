import { useState } from "react";
import { Card } from "../ui/Card";
import { StyledButton } from "../ui/StyledButton";
import styled from "styled-components";
import { Link } from "react-router-dom";
import { useAuth } from "../router/AuthContext";

export function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const { homePage } = useAuth();

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
      const res = await fetch("http://localhost:3000/auth/password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not change password");
      setMessage("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ChangePasswordCard>
      <Title>Change Your Password</Title>
      <br />
      <Form onSubmit={handleSubmit}>
        <Label>
          Current Password:
          <Input
            type="password"
            name="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </Label>
        <Label>
          New Password:
          <Input
            type="password"
            name="newPassword"
            value={newPassword}
            minLength={8}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </Label>
        <Label>
          Confirm New Password:
          <Input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            minLength={8}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </Label>
        {error && <p style={{ color: "red" }}>{error}</p>}
        {message && <p style={{ color: "green" }}>{message}</p>}
        <LoginButtonContainer>
          <Link to={homePage}><StyledButton>{`\< Return`}</StyledButton></Link>
          <StyledButton $emphasize={true} type="submit" disabled={submitting}>
            {submitting ? "Updating..." : "Change Password"}
          </StyledButton>
        </LoginButtonContainer>
      </Form>
    </ChangePasswordCard>
  );
}

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  margin: 0 0 4px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
`;

const Label = styled.label`
  font-size: 0.875rem;
  color: #475569;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  color: #0f172a;
  font-size: 0.95rem;
  transition: box-shadow 160ms ease, border-color 160ms ease;
  box-shadow: 0 1px 0 rgba(2, 6, 23, 0.02);

  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.9);
    box-shadow: 0 6px 18px rgba(59, 130, 246, 0.08);
  }
`;

const ChangePasswordCard = styled(Card)`
  width: 40%;
  p {
    text-align: center;
  }
`;

const LoginButtonContainer = styled.div`
  margin: auto;
  width: 100%;
  text-align: center;
  display: flex;
  gap: 1rem;
  justify-content: center;
`;
