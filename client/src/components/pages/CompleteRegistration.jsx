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
  const { user, isAuthenticated, refreshUser, register } = useAuth();

  // Check if coming from guest reservation flow (pre-checkout registration)
  const fromGuestReservation = location.state?.fromGuestReservation;
  const guestData = location.state?.guestData;
  const reservationData = location.state?.reservationData;
  const costDetails = location.state?.costDetails;
  const spotDetails = location.state?.spotDetails;
  const isHoliday = location.state?.isHoliday;
  const holidayNames = location.state?.holidayNames;

  // Get receipt data passed from payment page (for post-payment registration flow)
  const receiptData = location.state?.receiptData;

  const [form, setForm] = useState({
    email: guestData?.email || "",
    firstName: guestData?.firstName || "",
    lastName: guestData?.lastName || "",
    phone: guestData?.phone || "",
    password: "",
    confirmPassword: "",
    affiliation: "",
    status: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // For guest reservation flow: if user is already logged in with complete account, redirect
  // For post-payment flow: if not authenticated or already complete, redirect appropriately
  useEffect(() => {
    if (!fromGuestReservation) {
      // Post-payment flow
      if (!isAuthenticated) {
        navigate('/login');
      } else if (user?.accountStatus === 'complete') {
        navigate('/customer-dash');
      }
    } else {
      // Guest reservation flow - if already logged in with complete account, go to regular reservation
      if (isAuthenticated && user?.accountStatus === 'complete') {
        navigate('/make-reservation');
      }
    }
  }, [isAuthenticated, user, navigate, fromGuestReservation]);

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
      if (fromGuestReservation) {
        // New flow: Create account first, then redirect to make-reservation with pre-filled data
        // Register the user with full information
        await register({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
          affiliation: form.affiliation,
          status: form.status,
        });

        // Refresh to get the new user data
        await refreshUser();

        // Navigate to make-reservation page with pre-filled reservation data
        navigate("/make-reservation", {
          state: {
            prefillReservation: {
              startDate: reservationData.startDate,
              endDate: reservationData.endDate,
              siteId: reservationData.siteId,
              rvSize: reservationData.rvSize,
            },
            spotDetails: spotDetails,
            costDetails: costDetails,
            isHoliday: isHoliday,
            holidayNames: holidayNames,
            fromGuestFlow: true,
          },
        });
      } else {
        // Original flow: Complete pending account registration
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
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        setError("An account with this email already exists. Please login instead.");
      } else {
        setError(err.response?.data?.error || "Failed to complete registration");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Different UI for guest reservation flow vs post-payment flow
  if (fromGuestReservation) {
    return (
      <RegisterCard>
        <Title>Create Your Account</Title>
        <Subtitle>
          Complete your registration to proceed with checkout.
        </Subtitle>

        {/* Show reservation summary */}
        {costDetails && spotDetails && (
          <ReservationSummary>
            <SummaryTitle>Your Reservation</SummaryTitle>
            <SummaryRow>
              <SummaryLabel>Site:</SummaryLabel>
              <SummaryValue>{spotDetails.sitename} ({spotDetails.sitetype})</SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Dates:</SummaryLabel>
              <SummaryValue>
                {new Date(reservationData.startDate).toLocaleDateString()} - {new Date(reservationData.endDate).toLocaleDateString()}
              </SummaryValue>
            </SummaryRow>
            <SummaryRow>
              <SummaryLabel>Duration:</SummaryLabel>
              <SummaryValue>{costDetails.nights} night{costDetails.nights > 1 ? "s" : ""}</SummaryValue>
            </SummaryRow>
            <SummaryDivider />
            <SummaryRow $total>
              <SummaryLabel>Total:</SummaryLabel>
              <SummaryValue>${parseFloat(costDetails.totalCost).toFixed(2)}</SummaryValue>
            </SummaryRow>
          </ReservationSummary>
        )}

        <Form onSubmit={handleSubmit}>
          {/* Pre-filled personal info (read-only display) */}
          <InfoSection>
            <SectionLabel>Personal Information</SectionLabel>
            <InfoGrid>
              <InfoBox>
                <InfoLabel>Email:</InfoLabel>
                <InfoValue>{form.email}</InfoValue>
              </InfoBox>
              <InfoBox>
                <InfoLabel>Name:</InfoLabel>
                <InfoValue>{form.firstName} {form.lastName}</InfoValue>
              </InfoBox>
              <InfoBox>
                <InfoLabel>Phone:</InfoLabel>
                <InfoValue>{form.phone}</InfoValue>
              </InfoBox>
            </InfoGrid>
            <EditLink onClick={() => navigate(-1)}>← Edit personal information</EditLink>
          </InfoSection>

          <SectionLabel>Account Details</SectionLabel>

          <Label>
            Affiliation *
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
            Status *
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
            Password * (min 8 chars)
            <Input
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              minLength={8}
              required
            />
          </Label>

          <Label>
            Confirm Password *
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
            <BackButton type="button" onClick={() => navigate(-1)}>
              Back
            </BackButton>
            <StyledButton $emphasize type="submit" disabled={submitting}>
              {submitting ? "Creating Account..." : "Create Account & Continue"}
            </StyledButton>
          </ButtonContainer>
        </Form>
      </RegisterCard>
    );
  }

  // Original post-payment flow UI
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
  max-width: 560px;
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

const ReservationSummary = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 18px 20px;
  margin-bottom: 20px;
`;

const SummaryTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #166534;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: ${({ $total }) => ($total ? "1.05rem" : "0.9rem")};
  font-weight: ${({ $total }) => ($total ? "700" : "500")};
  color: ${({ $total }) => ($total ? "#166534" : "#15803d")};
`;

const SummaryLabel = styled.span``;
const SummaryValue = styled.span``;

const SummaryDivider = styled.hr`
  border: none;
  border-top: 1px dashed #86efac;
  margin: 8px 0;
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

const InfoSection = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
`;

const InfoGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const SectionLabel = styled.h4`
  margin: 0 0 12px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const EditLink = styled.button`
  background: none;
  border: none;
  color: #3b82f6;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 8px 0 0 0;
  text-decoration: underline;
  
  &:hover {
    color: #1d4ed8;
  }
`;

const InfoBox = styled.div`
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
`;

const InfoLabel = styled.span`
  color: #64748b;
  font-weight: 500;
  font-size: 0.8rem;
`;

const InfoValue = styled.span`
  color: #0f172a;
  font-weight: 600;
  font-size: 0.95rem;
  word-break: break-word;
  overflow-wrap: break-word;
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
  justify-content: space-between;
  gap: 12px;
  margin-top: 8px;
  flex-wrap: wrap;
`;

const BackButton = styled.button`
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }
`;
