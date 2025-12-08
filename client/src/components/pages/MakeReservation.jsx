import styled from "styled-components";
import axios from "axios";
import { Card } from "../ui/Card";
import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { StyledButton } from "../ui/StyledButton";
import { useAuth } from "../router/AuthContext";

/*
  Filter down spots based on RV size
  Filter so it shows the smallest avialable sites
  Change reservation needs to be so that you can't pick a spot that already exists.
  Make it so there's a user dropdown for the employee make reservation
  Autofill name based on the user for the customer make reservation
*/

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

export function MakeReservation() {
  const location = useLocation();
  const prefillSpot = location.state?.spot;
  const { user, homepage } = useAuth();
  const navigate = useNavigate();
  const [usersList, setUsersList] = useState([]);

  const [form, setForm] = useState({
    userId: user.role != "customer" ? "" : user.userId,
    rvSize: prefillSpot?.type || "",
    startDate: "",
    endDate: "",
    spot: prefillSpot?.id || "",
  });

  const [availableSpots, setAvailableSpots] = useState([]);
  const [costPreview, setCostPreview] = useState(null);
  const [holidayWarning, setHolidayWarning] = useState(null);

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

  // fetch availability when both dates selected
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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user?.userId) {
      alert("You must be logged in to make a reservation");
      return;
    }

    if (!form.spot) {
      alert("Please select an available spot");
      return;
    }

    if (!form.startDate || !form.endDate) {
      alert("Please select start and end dates");
      return;
    }

    // Validate reservation dates
    const validation = validateReservationDates(form.startDate, form.endDate);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    const body = {
      userId: parseInt(form.userId),
      siteId: parseInt(form.spot),
      startDate: form.startDate,
      endDate: form.endDate,
      notes: `RV: ${form.rvSize}`,
    };

    try {
      const res = await axios.post("http://localhost:3000/reservations", body);
      
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
        },
      });
    } catch (err) {
      console.error(err);
      alert("Error making reservation");
    }
  }

  useEffect(() => {
    if (user.role == "admin" || user.role == "employee") {
      fetchUsers();
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3000/admin/users", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsersList(data);

      console.log(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Title>Make a Reservation</Title>

        <Grid>
          {user.role != "customer" ? (
            <Field>
              <Label>User</Label>
              <SelectInput
                value={form.userId}
                name="userId"
                onChange={updateField}
              >
                <option value="" disabled selected>
                  -- Select User --
                </option>
                <option value="new">New User</option>
                {usersList.map((u) => {
                  return (
                    <option key={u.userId} value={u.userId}>
                      {u.emailaddress} - {u.lastname}, {u.firstname}
                    </option>
                  );
                })}
              </SelectInput>
            </Field>
          ) : (
            ""
          )}

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
              disabled={!!prefillSpot}
            >
              <option value="">
                {prefillSpot ? prefillSpot.name : "-- Select a spot --"}
              </option>

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

        <Actions>
          <StyledButton $emphasize={true} type="submit">
            Submit Reservation
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

const NumberInput = styled.input`
  ${sharedInput}
`;

const DateInput = styled.input`
  ${sharedInput}
`;

const TimeInput = styled.input`
  ${sharedInput}
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
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
