import styled from "styled-components";
import axios from "axios";
import { Card } from "../ui/Card";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { StyledButton } from "../ui/StyledButton";
import { useAuth } from "../router/AuthContext";

// Validation: 14-day limit in peak season (April-October), 6 months advance max
function validateReservationDates(startDate, endDate) {
  // Parse dates as LOCAL dates, not UTC
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);

  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "Invalid date format" };
  }

  if (end <= start) {
    return { valid: false, error: "End date must be after start date" };
  }

  if (start < today) {
    return { valid: false, error: "Start date cannot be in the past" };
  }

  // 6-month advance booking max
  const sixMonthsFromNow = new Date(today);
  sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
  if (start > sixMonthsFromNow) {
    return {
      valid: false,
      error: "Reservations can only be made up to 6 months in advance",
    };
  }

  const durationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  const isPeakSeason = (date) => {
    const month = date.getMonth();
    return month >= 3 && month <= 9;
  };

  // Check each day for peak season intersection
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
  const { user, isAuthenticated } = useAuth();

  const [error, setError] = useState(null);

  // Combined form: Guest info + Reservation details
  const [form, setForm] = useState({
    // Guest info
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    // Reservation details
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
    if (isAuthenticated && user?.accountStatus === "complete") {
      navigate("/make-reservation");
    }
  }, [isAuthenticated, user, navigate]);

  function updateField(e) {
    const { name, value } = e.target;

    // DATE VALIDATION (same behavior as MakeReservation)
    if (name === "startDate" || name === "endDate") {
      const newStart = name === "startDate" ? value : form.startDate;
      const newEnd = name === "endDate" ? value : form.endDate;

      // Only validate if both chosen
      if (newStart && newEnd) {
        const validation = validateReservationDates(newStart, newEnd);
        if (!validation.valid) {
          setError(validation.error);
          return;
        }
        setError(null);
      }

      // Also auto-fill end date when start updates
      if (name === "startDate") {
        const startDate = new Date(value);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        const endDateStr = endDate.toISOString().split("T")[0];

        setForm({ ...form, startDate: value, endDate: endDateStr });
        return;
      }

      setForm({ ...form, [name]: value });
      return;
    }

    // NORMAL FIELD UPDATE
    setForm({ ...form, [name]: value });
  }

  // Calculate cost when spot and dates are selected
  useEffect(() => {
    if (!form.spot || !form.startDate || !form.endDate) {
      setCostPreview(null);
      return;
    }

    async function fetchCost() {
      try {
        const res = await axios.get(
          "http://localhost:3000/api/calculate-cost",
          {
            params: {
              siteId: form.spot,
              startDate: form.startDate,
              endDate: form.endDate,
            },
          }
        );
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
        const res = await axios.get(
          "http://localhost:3000/api/holidays/check",
          {
            params: {
              startDate: form.startDate,
              endDate: form.endDate,
            },
          }
        );
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

  function handleCheckout(e) {
    e.preventDefault();
    setError(null);

    // REQUIRED FIELDS
    if (!form.email || !form.firstName || !form.lastName || !form.phone) {
      setError("Please fill in all personal information fields");
      return;
    }

    if (!form.startDate || !form.endDate) {
      setError("Please select start and end dates");
      return;
    }

    // EMAIL FORMAT
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address");
      return;
    }

    // SPOT
    if (!form.spot) {
      setError("Please select an available spot");
      return;
    }

    // DATE RULE VALIDATION
    const validation = validateReservationDates(form.startDate, form.endDate);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    // Get the selected spot details for the payment page
    const selectedSpot = availableSpots.find(
      (s) => s.siteid === parseInt(form.spot)
    );

    // Navigate to account creation page with all the data pre-filled
    navigate("/complete-registration", {
      state: {
        guestData: {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        },
        reservationData: {
          siteId: parseInt(form.spot),
          startDate: form.startDate,
          endDate: form.endDate,
          rvSize: form.rvSize,
        },
        costDetails: costPreview,
        spotDetails: selectedSpot,
        isHoliday: holidayWarning !== null,
        holidayNames: holidayWarning?.map((h) => h.name) || [],
        fromGuestReservation: true,
      },
    });
  }

  return (
    <Card>
      <Form onSubmit={handleCheckout}>
        <Title>Reserve Your Spot</Title>
        <Subtitle>
          Enter your details and reservation preferences. You'll create an
          account at checkout.
        </Subtitle>

        {/* Personal Information Section */}
        <SectionTitle>Your Information</SectionTitle>
        <Grid>
          <Field>
            <Label>Email *</Label>
            <TextInput
              name="email"
              type="email"
              value={form.email}
              onChange={updateField}
              placeholder="your@email.com"
              required
            />
          </Field>

          <Field>
            <Label>Phone *</Label>
            <TextInput
              name="phone"
              type="tel"
              value={form.phone}
              onChange={updateField}
              placeholder="555-123-4567"
              required
            />
          </Field>

          <Field>
            <Label>First Name *</Label>
            <TextInput
              name="firstName"
              value={form.firstName}
              onChange={updateField}
              placeholder="John"
              required
            />
          </Field>

          <Field>
            <Label>Last Name *</Label>
            <TextInput
              name="lastName"
              value={form.lastName}
              onChange={updateField}
              placeholder="Doe"
              required
            />
          </Field>
        </Grid>

        {/* Reservation Details Section */}
        <SectionTitle>Reservation Details</SectionTitle>
        <Grid>
          <Field>
            <Label>RV Size</Label>
            <TextInput
              name="rvSize"
              value={form.rvSize}
              onChange={updateField}
              placeholder="e.g., 30ft Class A"
            />
          </Field>

          <Field>
            <Label>Start Date *</Label>
            <DateInput
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={updateField}
              required
            />
          </Field>

          <Field>
            <Label>End Date *</Label>
            <DateInput
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={updateField}
              required
            />
          </Field>

          <Field>
            <Label>Available Spot *</Label>
            <SelectInput
              name="spot"
              value={form.spot}
              onChange={updateField}
              required
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
              <strong>Holiday/Special Event Notice:</strong> Your reservation
              overlaps with {holidayWarning.map((h) => h.name).join(", ")}.
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
                <CostValue>
                  ${parseFloat(costPreview.rate).toFixed(2)}
                </CostValue>
              </CostRow>
              <CostRow>
                <CostLabel>Number of Nights:</CostLabel>
                <CostValue>{costPreview.nights}</CostValue>
              </CostRow>
              <CostDivider />
              <CostRow $total>
                <CostLabel>Total Cost:</CostLabel>
                <CostValue>
                  ${parseFloat(costPreview.totalCost).toFixed(2)}
                </CostValue>
              </CostRow>
            </CostBreakdown>
          </CostPreview>
        )}

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Actions>
          <StyledButton type="button" onClick={() => navigate("/login")}>
            Already have an account? Login
          </StyledButton>
          <StyledButton $emphasize={true} type="submit" disabled={!!error}>
            Proceed to Checkout
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

const SectionTitle = styled.h3`
  margin: 8px 0 0 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
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
