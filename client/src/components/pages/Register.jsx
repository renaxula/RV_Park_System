import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "../ui/Card";
import { useAuth } from "../router/AuthContext";
import styled from "styled-components";
import { StyledButton } from "../ui/StyledButton";

export function Register() {
  const navigate = useNavigate();
  const { register, setError, error, isAuthenticated } = useAuth();

  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    affiliation: "",
    status: "",
    salt: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return (
      <RegisterCard>
        <p>You are already signed in.</p>
      </RegisterCard>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSubmitting(true);
    setError(null);
    setForm((prev) => ({
      ...prev,
      ["salt"]: crypto.randomBytes(16).toString("hex"),
    }));
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

  /*
      {
      emailAddress: "mail@mail.com",
      username: "jdoe",
      firstName: "John",
      lastName: "Doe",
      phone: "8013658521",
      affiliation: "Air Force",
      status: "Active Duty",
      roleId: 1,
      salt: "dingle",
      password: "12345",
    },
  */

  return (
    <RegisterCard>
      <Title>Register</Title>
      <Form onSubmit={handleSubmit}>
        <Label>
          Email
          <Input
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            required
          />
        </Label>
        <Label>
          First Name
          <Input
            type="text"
            value={form.firstName}
            onChange={handleChange("firstName")}
            required
          />
        </Label>
        <Label>
          Last Name
          <Input
            type="text"
            value={form.lastName}
            onChange={handleChange("lastName")}
            required
          />
        </Label>
        <Label>
          Phone Number
          <Input
            type="tel"
            value={form.phone}
            onChange={handleChange("phone")}
            required
          />
        </Label>
        <Label>
          Username
          <Input
            type="text"
            value={form.username}
            onChange={handleChange("username")}
            required
          />
        </Label>
        <Label>
          Affiliation
          <Select
            value={form.affiliation}
            onChange={handleChange("affiliation")}
            required
          >
            <option value="">Select Affiliation</option>
            <option value="Air Force">Air Force</option>
            <option value="Navy">Navy</option>
            <option value="Army">Army</option>
            <option value="Marines">Marines</option>
            <option value="Coast Guard">Coast Guard</option>
            <option value="DOD Authorized Civilian">
              DOD Authorized Civilian
            </option>
          </Select>
        </Label>

        <Label>
          Status
          <Select
            value={form.status}
            onChange={handleChange("status")}
            required
          >
            <option value="">Select Status</option>
            <option value="Active Duty">Active Duty</option>
            <option value="Retired">Retired</option>
            <option value="Reservist">Reservist</option>
            <option value="PCS In">PCS In</option>
            <option value="PCS Out">PCS Out</option>
          </Select>
        </Label>
        <Label>
          Password (min 8 chars)
          <Input
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            minLength={8}
            required
          />
        </Label>
        <Label>
          Confirm Password
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </Label>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <LoginButtonContainer>
          <StyledButton type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Register"}
          </StyledButton>
        </LoginButtonContainer>
        <p>
          Already have an account? <StyledLink to="/login">Login</StyledLink>
        </p>
      </Form>
    </RegisterCard>
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

const RegisterCard = styled(Card)`
  width: 40%;
  p {
    text-align: center;
  }
`;

const StyledLink = styled(Link)`
  color: #4077d1ff;
`;

const LoginButtonContainer = styled.div`
  margin: auto;
  width: 100%;
  text-align: center;
`;

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  color: #0f172a;
  font-size: 0.95rem;
  transition: box-shadow 160ms ease, border-color 160ms ease;
  box-shadow: 0 1px 0 rgba(2,6,23,0.02);

  &:focus {
    outline: none;
    border-color: rgba(59,130,246,0.9);
    box-shadow: 0 6px 18px rgba(59,130,246,0.08);
  }
`;