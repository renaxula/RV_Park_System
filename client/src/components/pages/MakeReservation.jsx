import styled from "styled-components";
import axios from "axios";
import { Card } from "../ui/Card";
import { useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { StyledButton } from "../ui/StyledButton";

export function MakeReservation() {
  const location = useLocation();
  const prefillSpot = location.state?.spot;

  const [form, setForm] = useState({
    rvSize: prefillSpot?.type || "",
    siteSize: "",
    startDate: "",
    endDate: "",
    spot: prefillSpot?.id || ""
  });

  const [availableSpots, setAvailableSpots] = useState([]);

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // fetch availability when both dates selected
  useEffect(() => {
    if (!form.startDate || !form.endDate) return;

    async function fetchSpots() {
      try {
        const res = await axios.get("http://localhost:3000/spots", {
          params: {
            start: form.startDate,
            end: form.endDate
          }
        });
        setAvailableSpots(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchSpots();
  }, [form.startDate, form.endDate]);

  async function handleSubmit(e) {
    e.preventDefault();

    const body = {
      userId: 1,
      siteId: form.spot,
      startDate: form.startDate,
      endDate: form.endDate,
      notes: `RV: ${form.rvSize}, Site size: ${form.siteSize}`
    };

    try {
      const res = await axios.post("http://localhost:3000/reservations", body);
      alert("Reservation created!");
    } catch (err) {
      console.error(err);
      alert("Error making reservation");
    }
  }

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Title>Make a Reservation</Title>

        <Grid>

          <Field>
            <Label>Name</Label>
            <TextInput name="name" value={form.name} onChange={updateField} />
          </Field>

          <Field>
            <Label>RV Size</Label>
            <TextInput name="rvSize" value={form.rvSize} onChange={updateField} />
          </Field>

          <Field>
            <Label>Site Size</Label>
            <TextInput name="siteSize" value={form.siteSize} onChange={updateField} />
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

        <Actions>
          <StyledButton $emphasize={true} type="submit">Submit Reservation</StyledButton>
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
