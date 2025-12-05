import React, { useState } from "react";
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
  const { homePage } = useAuth();
 
  const reservation = location.state?.reservation || null;

  const [form, setForm] = useState({
    startDate: formatDateForInput(reservation?.startdate) || "",
    endDate: formatDateForInput(reservation?.enddate) || "",
  });

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

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:3000/reservations/${reservation.reservationid}`,
        {
          startDate: form.startDate,
          endDate: form.endDate,
        },
        { withCredentials: true }
      );

      alert("Reservation updated!");
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

        <InfoSection>
          <InfoRow>
            <InfoLabel>Site:</InfoLabel>
            <InfoValue>{reservation.sitename}</InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Site Type:</InfoLabel>
            <InfoValue>{reservation.sitetype}</InfoValue>
          </InfoRow>
        </InfoSection>

        <Grid>
          <Field>
            <Label>Check-in Date</Label>
            <DateInput
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={updateField}
            />
          </Field>

          <Field>
            <Label>Check-out Date</Label>
            <DateInput
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={updateField}
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



/* Styled Components */

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

const InfoSection = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InfoRow = styled.div`
  display: flex;
  gap: 8px;
`;

const InfoLabel = styled.span`
  font-size: 0.875rem;
  color: #64748b;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 0.875rem;
  color: #0f172a;
  font-weight: 600;
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

const DateInput = styled.input`
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
