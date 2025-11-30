import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { Card } from "../ui/Card";
import { useLocation, useNavigate } from "react-router-dom";

export function EditReservation() {
  const location = useLocation();
  const navigate = useNavigate();

  const reservation = location.state?.reservation || null;

  const [form, setForm] = useState({
    name: reservation?.name || "",
    rvSize: reservation?.rvSize || "",
    siteId: reservation?.siteId || "",
    startDate: reservation?.startDate || "",
    endDate: reservation?.endDate || "",
  });

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      await axios.put(
        `http://localhost:3000/reservations/${reservation.id}`,
        {
          name: form.name,
          siteId: form.siteId,
          startDate: form.startDate,
          endDate: form.endDate,
          rvSize: form.rvSize,
        }
      );

      alert("Reservation updated!");
      navigate("/reservations");
    } catch (err) {
      console.error(err);
      alert("Error updating reservation");
    }
  }

  async function cancelReservation() {
    if (!window.confirm("Are you sure you want to cancel this reservation?")) return;

    try {
      await axios.delete(`http://localhost:3000/reservations/${reservation.id}`);
      alert("Reservation canceled.");
      navigate("/reservations");
    } catch (err) {
      console.error(err);
      alert("Error canceling reservation");
    }
  }

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Title>Edit Reservation</Title>

        <Grid>

          <Field>
            <Label>Name</Label>
            <TextInput disabled name="name" value={form.name} onChange={updateField} />
          </Field>

          <Field>
            <Label>RV Size</Label>
            <TextInput disabled name="rvSize" value={form.rvSize} onChange={updateField} />
          </Field>

          <Field>
            <Label>Site ID</Label>
            <TextInput disabled name="siteId" value={form.siteId} onChange={updateField} />
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
