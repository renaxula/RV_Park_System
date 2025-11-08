import React from "react";
import styled from "styled-components";
import { Card } from "../ui/Card";

export function MakeReservation() {
  return (
    <Card>
      <Form noValidate>
        <Title>Make a Reservation</Title>

        <Grid>
          <Field>
            <Label htmlFor="name">Name</Label>
            <TextInput id="name" name="name" type="text" />
          </Field>

          <Field>
            <Label htmlFor="rvSize">RV size (ft)</Label>
            <NumberInput id="rvSize" name="rvSize" min="1" />
          </Field>

          <Field>
            <Label htmlFor="siteSize">Site size (ft)</Label>
            <NumberInput id="siteSize" name="siteSize" min="1" />
          </Field>

          <Field>
            <Label htmlFor="startDate">Start date</Label>
            <DateInput id="startDate" name="startDate" type="date" />
          </Field>

          <Field>
            <Label htmlFor="endDate">End date</Label>
            <DateInput id="endDate" name="endDate" type="date" />
          </Field>

          <Field>
            <Label htmlFor="time">Time</Label>
            <TimeInput id="time" name="time" type="time" />
          </Field>
        </Grid>

        <Actions>
          <SubmitButton type="submit">Submit Reservation</SubmitButton>
        </Actions>
      </Form>
    </Card>
  );
}

/* Styled components */

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

const SubmitButton = styled.button`
  background: linear-gradient(90deg, #045de9 0%, #09c6f9 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(3, 102, 214, 0.18);
  transition: transform 140ms ease, box-shadow 140ms ease, opacity 120ms ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 26px rgba(3, 102, 214, 0.22);
  }

  &:active {
    transform: translateY(0);
    opacity: 0.97;
  }

  &:focus {
    outline: 2px solid rgba(59,130,246,0.24);
    outline-offset: 2px;
  }
`;