import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../router/AuthContext";
import styled from "styled-components";
import { StyledButton } from "../ui/StyledButton";
import { Card } from "../ui/Card";

export function RegisterForm(props) {
  const { register, setError, error, isAuthenticated, homePage } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "defaultPass",
    firstName: "",
    lastName: "",
    phone: "",
    affiliation: "DOD Authorized Civilian", // default
    status: "",
    employeeAction: true,
  });
  const [confirmPassword, setConfirmPassword] = useState("defaultPass");
  const [submitting, setSubmitting] = useState(false);

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
      props.onRegister(form.email);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;

    // Clear status if affiliation is DOD Authorized Civilian
    if (field === "affiliation" && value === "DOD Authorized Civilian") {
      setForm((prev) => ({ ...prev, affiliation: value, status: "" }));
    } else {
      setForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  return (
    <RegisterCard>
      <Title>New User Details</Title>
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
          Affiliation
          <Select
            value={form.affiliation}
            onChange={handleChange("affiliation")}
            required
          >
            <option value="DOD Authorized Civilian">
              DOD Authorized Civilian
            </option>
            <option value="Air Force">Air Force</option>
            <option value="Navy">Navy</option>
            <option value="Army">Army</option>
            <option value="Marines">Marines</option>
            <option value="Coast Guard">Coast Guard</option>
          </Select>
        </Label>

        {/* Status only shows for non-Civilian */}
        {form.affiliation !== "DOD Authorized Civilian" && (
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
        )}

        <Label>
          Password (min 8 chars)
          <Input
            type="input"
            value={form.password}
            onChange={handleChange("password")}
            minLength={8}
            required
          />
        </Label>

        <Label>
          Confirm Password
          <Input
            type="input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            minLength={8}
            required
          />
        </Label>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <LoginButtonContainer>
          <StyledButton type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Register and Submit"}
          </StyledButton>
        </LoginButtonContainer>
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
  margin-bottom: 2rem;
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
  box-shadow: 0 1px 0 rgba(2, 6, 23, 0.02);

  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.9);
    box-shadow: 0 6px 18px rgba(59, 130, 246, 0.08);
  }
`;
