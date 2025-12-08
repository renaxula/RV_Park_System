import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card } from "../ui/Card";
import { useAuth } from "../router/AuthContext";
import styled from "styled-components";
import { StyledButton } from "../ui/StyledButton";
import axios from "axios";

export function CompleteRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, refreshUser } = useAuth();

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
    affiliation: "",
    status: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Get receipt data passed from payment page
  const receiptData = location.state?.receiptData;

  // If user is not logged in or already has complete account, redirect
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user?.accountStatus === 'complete') {
      navigate('/customer-dash');
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (!form.affiliation || !form.status) {
      setError("Please select your affiliation and status");
      return;
    }

    setSubmitting(true);

    try {
      await axios.post(
        "http://localhost:3000/auth/complete-registration",
        {
          password: form.password,
          affiliation: form.affiliation,
          status: form.status,
        },
        { withCredentials: true }
      );

      // Refresh user data to get updated accountStatus
      if (refreshUser) {
        await refreshUser();
      }

      navigate('/customer-dash');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to complete registration");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <RegisterCard>
      <Title>Complete Your Account</Title>
      <Subtitle>
        Your reservation has been confirmed! Set a password to access your account.
      </Subtitle>

      {receiptData && (
        <ConfirmationBanner>
          <ConfirmationIcon>✓</ConfirmationIcon>
          <ConfirmationText>
            <strong>Reservation Confirmed!</strong>
            <br />
            Confirmation #: RVP-{receiptData.reservation?.reservationid?.toString().padStart(6, "0")}
          </ConfirmationText>
        </ConfirmationBanner>
      )}

      <Form onSubmit={handleSubmit}>
        <InfoBox>
          <InfoLabel>Email:</InfoLabel>
          <InfoValue>{user?.email}</InfoValue>
        </InfoBox>

        <Label>
          Affiliation
          <Select
            value={form.affiliation}
            onChange={handleChange("affiliation")}
            required
          >
            <option value="">Select Affiliation</option>
            <option value="Army">Army</option>
            <option value="Navy">Navy</option>
            <option value="Marine Corps">Marine Corps</option>
            <option value="Air Force">Air Force</option>
            <option value="Space Force">Space Force</option>
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
            value={form.confirmPassword}
            onChange={handleChange("confirmPassword")}
            minLength={8}
            required
          />
        </Label>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <ButtonContainer>
          <StyledButton $emphasize type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Complete Registration"}
          </StyledButton>
        </ButtonContainer>
      </Form>
    </RegisterCard>
  );
}

const RegisterCard = styled(Card)`
  max-width: 500px;
  margin: 0 auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  margin: 0 0 4px 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
`;

const Subtitle = styled.p`
  margin: 0 0 20px 0;
  font-size: 0.95rem;
  color: #64748b;
`;

const ConfirmationBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #10b981;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 20px;
`;

const ConfirmationIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  font-size: 1.2rem;
  font-weight: bold;
`;

const ConfirmationText = styled.div`
  color: #065f46;
  font-size: 0.95rem;
`;

const InfoBox = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  gap: 8px;
`;

const InfoLabel = styled.span`
  color: #64748b;
  font-weight: 500;
`;

const InfoValue = styled.span`
  color: #0f172a;
  font-weight: 600;
`;

const Label = styled.label`
  font-size: 0.875rem;
  color: #475569;
  font-weight: 600;
  display: flex;
  flex-direction: column;
  gap: 6px;
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

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 12px 16px;
  color: #dc2626;
  font-size: 0.9rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
`;


