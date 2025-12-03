import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import { Card } from "../ui/Card";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../router/AuthContext";

// Helper to format date string for input[type="date"]
function formatDateForInput(dateStr) {
  if (!dateStr) return "";
  return dateStr.split("T")[0];
}

export function EditReservation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, homePage } = useAuth();
 
  const reservation = location.state?.reservation || null;

  const [form, setForm] = useState({
    siteName: reservation?.sitename || "",
    siteType: reservation?.sitetype || "",
    siteId: reservation?.siteid || "",
    startDate: formatDateForInput(reservation?.startdate) || "",
    endDate: formatDateForInput(reservation?.enddate) || "",
    notes: reservation?.notes || "",
  });

  const [availableSites, setAvailableSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Fetch available sites when dates change
  useEffect(() => {
    if (!form.startDate || !form.endDate) return;

    async function fetchSites() {
      setLoadingSites(true);
      try {
        const res = await axios.get("http://localhost:3000/api/availableSites", {
          params: {
            startDate: form.startDate,
            endDate: form.endDate
          }
        });
        setAvailableSites(res.data);
      } catch (err) {
        console.error("Error fetching available sites:", err);
      } finally {
        setLoadingSites(false);
      }
    }

    fetchSites();
  }, [form.startDate, form.endDate]);

  if (!reservation) {
    return (
      <Card>
        <Title>No reservation selected</Title>
        <p>Please go back and select a reservation to edit.</p>
      </Card>
    );
  }

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSiteChange(e) {
    const selectedSiteId = e.target.value;
    if (selectedSiteId === String(reservation.siteid)) {
      // User selected the original site
      setForm({
        ...form,
        siteId: reservation.siteid,
        siteName: reservation.sitename,
        siteType: reservation.sitetype
      });
    } else {
      // User selected a different available site
      const selectedSite = availableSites.find(s => String(s.siteid) === selectedSiteId);
      if (selectedSite) {
        setForm({
          ...form,
          siteId: selectedSite.siteid,
          siteName: selectedSite.sitename,
          siteType: selectedSite.sitetype
        });
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:3000/reservations/${reservation.reservationid}`,
        {
          siteId: form.siteId,
          startDate: form.startDate,
          endDate: form.endDate,
          notes: form.notes,
        },
        { withCredentials: true }
      );

      alert("Reservation updated!");
      console.log("Navigating to homepage:", homePage);
      navigate(homePage);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error updating reservation");
    }
  }

  async function cancelReservation() {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;

    try {
      await axios.delete(
        `http://localhost:3000/reservations/${reservation.reservationid}`,
        { withCredentials: true }
      );
      alert("Reservation canceled.");
      navigate(homePage);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error canceling reservation");
    }
  }

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Title>Edit Reservation</Title>

        <Grid>

          <Field>
            <Label>Site</Label>
            <SelectInput
              name="siteId"
              value={form.siteId}
              onChange={handleSiteChange}
            >
              {/* Always show the current reservation's site as an option */}
              <option value={reservation.siteid}>
                {reservation.sitename} — {reservation.sitetype} (current)
              </option>
              
              {/* Show other available sites */}
              {loadingSites ? (
                <option disabled>Loading available sites...</option>
              ) : (
                availableSites
                  .filter(s => s.siteid !== reservation.siteid)
                  .map((s) => (
                    <option key={s.siteid} value={s.siteid}>
                      {s.sitename} — {s.sitetype} — ${s.rate}/night
                    </option>
                  ))
              )}
            </SelectInput>
            <HelpText>
              Change dates to see other available sites
            </HelpText>
          </Field>

          <Field>
            <Label>Site Type</Label>
            <TextInput disabled name="siteType" value={form.siteType} />
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

          <Field style={{ gridColumn: "1 / -1" }}>
            <Label>Notes</Label>
            <TextInput
              name="notes"
              value={form.notes}
              onChange={updateField}
              placeholder="Add any notes..."
            />
          </Field>

        </Grid>

        <Actions>
          <CancelButton type="button" onClick={cancelReservation}>
            Cancel Reservation
          </CancelButton>

          <SubmitButton type="submit">
            Save Changes
          </SubmitButton>
        </Actions>

      </Form>
    </Card>
  );
}



/* Styled Components (same as before, adding CancelButton) */

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

const SelectInput = styled.select`${sharedInput}`;
const TextInput = styled.input`${sharedInput}`;
const DateInput = styled.input`${sharedInput}`;

const HelpText = styled.span`
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 4px;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SubmitButton = styled.button`
  background: #045de9;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
`;

const CancelButton = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;
