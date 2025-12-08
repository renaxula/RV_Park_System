import styled from "styled-components";
import axios from "axios";
import { Card } from "../ui/Card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { StyledButton } from "../ui/StyledButton";
import { useAuth } from "../router/AuthContext";

// Validation: 14-day limit in peak season (April-October), 6 months advance max
function validateReservationDates(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  if (end <= start) {
    return { valid: false, error: "End date must be after start date" };
  }

  // Check 6 months advance booking limit
  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  if (start > sixMonthsFromNow) {
    return {
      valid: false,
      error: "Reservations can only be made up to 6 months in advance",
    };
  }

  // Calculate duration in days
  const durationMs = end - start;
  const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

  // Check if any part of the reservation falls in peak season (April-October)
  const isPeakSeason = (date) => {
    const month = date.getMonth();
    return month >= 3 && month <= 9;
  };

  let touchesPeakSeason = false;
  const checkDate = new Date(start);
  while (checkDate < end) {
    if (isPeakSeason(checkDate)) {
      touchesPeakSeason = true;
      break;
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  if (touchesPeakSeason && durationDays > 14) {
    return {
      valid: false,
      error:
        "Reservations during peak season (April - October) are limited to 14 days",
    };
  }

  return { valid: true };
}

export function GuestReservation() {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshUser } = useAuth();
  
  // Step 1: Guest info, Step 2: Reservation details
  const [step, setStep] = useState(1);
  const [guestUser, setGuestUser] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Guest info form
  const [guestForm, setGuestForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });

  // Reservation form
  const [form, setForm] = useState({
    rvSize: "",
    startDate: "",
    endDate: "",
    spot: "",
  });

  const [availableSpots, setAvailableSpots] = useState([]);
  const [costPreview, setCostPreview] = useState(null);
  const [holidayWarning, setHolidayWarning] = useState(null);

  // If user is already logged in with complete account, redirect to regular reservation
  useEffect(() => {
    if (isAuthenticated && user?.accountStatus === 'complete') {
      navigate('/make-reservation');
    }
    // If user has pending account, skip to step 2
    if (isAuthenticated && user?.accountStatus === 'pending') {
      setGuestUser(user);
      setStep(2);
    }
  }, [isAuthenticated, user, navigate]);

  function updateGuestField(e) {
    const { name, value } = e.target;
    setGuestForm({ ...guestForm, [name]: value });
  }

  function updateField(e) {
    const { name, value } = e.target;
    
    // If start date is changed, auto-populate end date to 1 week later
    if (name === "startDate" && value) {
      const startDate = new Date(value);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      const endDateStr = endDate.toISOString().split("T")[0];
      
      setForm({ ...form, startDate: value, endDate: endDateStr });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  // Handle guest info submission
  async function handleGuestSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await axios.post(
        "http://localhost:3000/auth/guest-start",
        guestForm,
        { withCredentials: true }
      );
      
      setGuestUser(res.data.user);
      // Refresh auth context so ProtectedRoute sees the user as authenticated
      await refreshUser();
      setStep(2);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.existingAccount) {
        setError("An account with this email already exists. Please login instead.");
      } else {
        setError(err.response?.data?.error || "Failed to start guest session");
      }
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate cost when spot and dates are selected
  useEffect(() => {
    if (!form.spot || !form.startDate || !form.endDate) {
      setCostPreview(null);
      return;
    }

    async function fetchCost() {
      try {
        const res = await axios.get("http://localhost:3000/api/calculate-cost", {
          params: {
            siteId: form.spot,
            startDate: form.startDate,
            endDate: form.endDate,
          },
        });
        setCostPreview(res.data);
      } catch (err) {
        console.error("Error calculating cost:", err);
      }
    }

    fetchCost();
  }, [form.spot, form.startDate, form.endDate]);

  // Check for holidays when dates are selected
  useEffect(() => {
    if (!form.startDate || !form.endDate) {
      setHolidayWarning(null);
      return;
    }

    async function checkHolidays() {
      try {
        const res = await axios.get("http://localhost:3000/api/holidays/check", {
          params: {
            startDate: form.startDate,
            endDate: form.endDate,
          },
        });
        if (res.data.isHoliday) {
          setHolidayWarning(res.data.holidays);
        } else {
          setHolidayWarning(null);
        }
      } catch (err) {
        console.error("Error checking holidays:", err);
      }
    }

    checkHolidays();
  }, [form.startDate, form.endDate]);

  // Fetch availability when both dates selected
  useEffect(() => {
    if (!form.startDate || !form.endDate) return;

    async function fetchSpots() {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/availableSites",
          {
            params: {
              startDate: form.startDate,
              endDate: form.endDate,
            },
          }
        );
        setAvailableSpots(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchSpots();
  }, [form.startDate, form.endDate]);

  async function handleReservationSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!guestUser?.userId) {
      setError("Guest session not found. Please start over.");
      setStep(1);
      return;
    }

    if (!form.spot) {
      setError("Please select an available spot");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Please select start and end dates");
      return;
    }

    // Validate reservation dates
    const validation = validateReservationDates(form.startDate, form.endDate);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSubmitting(true);

    const body = {
      userId: parseInt(guestUser.userId),
      siteId: parseInt(form.spot),
      startDate: form.startDate,
      endDate: form.endDate,
      notes: `RV: ${form.rvSize}`,
    };

    try {
      const res = await axios.post("http://localhost:3000/reservations", body, {
        withCredentials: true,
      });
      
      // Get the selected spot details for the payment page
      const selectedSpot = availableSpots.find(s => s.siteid === parseInt(form.spot));
      
      // Navigate to payment page with reservation details
      navigate("/payment", {
        state: {
          reservation: res.data.reservation,
          costDetails: costPreview,
          spotDetails: selectedSpot,
          isHoliday: holidayWarning !== null,
          holidayNames: holidayWarning?.map(h => h.name) || [],
          isGuestCheckout: true,
        },
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Error making reservation");
    } finally {
      setSubmitting(false);
    }
  }

  // Step 1: Guest Information
  if (step === 1) {
    return (
      <Card>
        <Form onSubmit={handleGuestSubmit}>
          <Title>Reserve Without an Account</Title>
          <Subtitle>Enter your information to get started. You'll create a password after payment.</Subtitle>

          <Grid>
            <Field>
              <Label>Email</Label>
              <TextInput
                name="email"
                type="email"
                value={guestForm.email}
                onChange={updateGuestField}
                placeholder="your@email.com"
                required
              />
            </Field>

            <Field>
              <Label>Phone</Label>
              <TextInput
                name="phone"
                type="tel"
                value={guestForm.phone}
                onChange={updateGuestField}
                placeholder="555-123-4567"
                required
              />
            </Field>

            <Field>
              <Label>First Name</Label>
              <TextInput
                name="firstName"
                value={guestForm.firstName}
                onChange={updateGuestField}
                placeholder="John"
                required
              />
            </Field>

            <Field>
              <Label>Last Name</Label>
              <TextInput
                name="lastName"
                value={guestForm.lastName}
                onChange={updateGuestField}
                placeholder="Doe"
                required
              />
            </Field>
          </Grid>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <Actions>
            <StyledButton type="button" onClick={() => navigate('/login')}>
              Already have an account? Login
            </StyledButton>
            <StyledButton $emphasize={true} type="submit" disabled={submitting}>
              {submitting ? "Starting..." : "Continue to Reservation"}
            </StyledButton>
          </Actions>
        </Form>
      </Card>
    );
  }

  // Step 2: Reservation Details
  return (
    <Card>
      <Form onSubmit={handleReservationSubmit}>
        <Title>Make a Reservation</Title>
        <GuestBadge>
          Booking as: {guestUser?.email}
          <SmallText>You'll set a password after payment</SmallText>
        </GuestBadge>

        <Grid>
          <Field>
            <Label>RV Size</Label>
            <TextInput
              name="rvSize"
              value={form.rvSize}
              onChange={updateField}
            />
          </Field>

          <Field>
            <Label>Start Date</Label>
            <DateInput
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={updateField}
            />
          </Field>

          <Field>
            <Label>End Date</Label>
            <DateInput
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={updateField}
            />
          </Field>

          <Field>
            <Label>Available Spot</Label>
            <SelectInput
              name="spot"
              value={form.spot}
              onChange={updateField}
            >
              <option value="">-- Select a spot --</option>
              {availableSpots.map((s) => (
                <option key={s.siteid} value={s.siteid}>
                  {s.sitename} — {s.sitetype} — ${s.rate}/night
                </option>
              ))}
            </SelectInput>
          </Field>
        </Grid>

        {holidayWarning && (
          <HolidayWarning>
            <WarningIcon>⚠️</WarningIcon>
            <WarningText>
              <strong>Holiday/Special Event Notice:</strong> Your reservation overlaps with{" "}
              {holidayWarning.map(h => h.name).join(", ")}. 
              Cancellation policy: 1-day fee applies regardless of timing.
            </WarningText>
          </HolidayWarning>
        )}

        {costPreview && (
          <CostPreview>
            <CostTitle>Reservation Cost Preview</CostTitle>
            <CostBreakdown>
              <CostRow>
                <CostLabel>Nightly Rate:</CostLabel>
                <CostValue>${parseFloat(costPreview.rate).toFixed(2)}</CostValue>
              </CostRow>
              <CostRow>
                <CostLabel>Number of Nights:</CostLabel>
                <CostValue>{costPreview.nights}</CostValue>
              </CostRow>
              <CostDivider />
              <CostRow $total>
                <CostLabel>Total Cost:</CostLabel>
                <CostValue>${parseFloat(costPreview.totalCost).toFixed(2)}</CostValue>
              </CostRow>
            </CostBreakdown>
          </CostPreview>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Actions>
          <StyledButton type="button" onClick={() => setStep(1)}>
            Back
          </StyledButton>
          <StyledButton $emphasize={true} type="submit" disabled={submitting}>
            {submitting ? "Processing..." : "Continue to Payment"}
          </StyledButton>
        </Actions>
      </Form>
    </Card>
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

const Subtitle = styled.p`
  margin: 0 0 12px 0;
  font-size: 0.9rem;
  color: #64748b;
`;

const GuestBadge = styled.div`
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
  border-radius: 8px;
  padding: 12px 16px;
  color: #1e40af;
  font-weight: 500;
`;

const SmallText = styled.span`
  display: block;
  font-size: 0.8rem;
  font-weight: 400;
  margin-top: 4px;
  color: #3b82f6;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  color: #475569;
  font-weight: 600;
`;

const sharedInput = `
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

const SelectInput = styled.select`
  ${sharedInput}
`;

const TextInput = styled.input`
  ${sharedInput}
`;

const DateInput = styled.input`
  ${sharedInput}
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 12px 16px;
  color: #dc2626;
  font-size: 0.9rem;
`;

const HolidayWarning = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: 10px;
  margin-top: 8px;
`;

const WarningIcon = styled.span`
  font-size: 1.25rem;
`;

const WarningText = styled.p`
  margin: 0;
  font-size: 0.875rem;
  color: #92400e;
  line-height: 1.5;
`;

const CostPreview = styled.div`
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border: 1px solid #10b981;
  border-radius: 12px;
  padding: 18px 20px;
  margin-top: 8px;
`;

const CostTitle = styled.h3`
  margin: 0 0 14px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #065f46;
`;

const CostBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CostRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: ${({ $total }) => ($total ? "1.1rem" : "0.95rem")};
  font-weight: ${({ $total }) => ($total ? "700" : "500")};
  color: ${({ $total }) => ($total ? "#047857" : "#064e3b")};
`;

const CostLabel = styled.span``;

const CostValue = styled.span`
  font-family: "SF Mono", "Monaco", "Inconsolata", monospace;
`;

const CostDivider = styled.hr`
  border: none;
  border-top: 1px dashed #10b981;
  margin: 6px 0;
`;

