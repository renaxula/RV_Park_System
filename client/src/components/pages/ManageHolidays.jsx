import styled from "styled-components";
import axios from "axios";
import { Card } from "../ui/Card";
import { useState, useEffect } from "react";
import { StyledButton } from "../ui/StyledButton";

export function ManageHolidays() {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [form, setForm] = useState({
    name: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  useEffect(() => {
    fetchHolidays();
  }, []);

  async function fetchHolidays() {
    try {
      const res = await axios.get("http://localhost:3000/api/holidays");
      setHolidays(res.data);
    } catch (err) {
      console.error("Error fetching holidays:", err);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ name: "", startDate: "", endDate: "", description: "" });
    setEditingHoliday(null);
    setShowForm(false);
  }

  function handleEdit(holiday) {
    setForm({
      name: holiday.name,
      startDate: formatDateForInput(holiday.startdate),
      endDate: formatDateForInput(holiday.enddate),
      description: holiday.description || "",
    });
    setEditingHoliday(holiday);
    setShowForm(true);
  }

  function formatDateForInput(dateStr) {
    if (!dateStr) return "";
    return dateStr.split("T")[0];
  }

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.startDate || !form.endDate) {
      alert("Please fill in name, start date, and end date");
      return;
    }

    try {
      if (editingHoliday) {
        await axios.put(
          `http://localhost:3000/api/holidays/${editingHoliday.holidayid}`,
          form,
          { withCredentials: true }
        );
        alert("Holiday updated!");
      } else {
        await axios.post("http://localhost:3000/api/holidays", form, {
          withCredentials: true,
        });
        alert("Holiday created!");
      }
      resetForm();
      fetchHolidays();
    } catch (err) {
      console.error("Error saving holiday:", err);
      alert(err.response?.data?.error || "Failed to save holiday");
    }
  }

  async function handleDelete(holidayId) {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return;

    try {
      await axios.delete(`http://localhost:3000/api/holidays/${holidayId}`, {
        withCredentials: true,
      });
      alert("Holiday deleted!");
      fetchHolidays();
    } catch (err) {
      console.error("Error deleting holiday:", err);
      alert(err.response?.data?.error || "Failed to delete holiday");
    }
  }

  function formatDisplayDate(dateStr) {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <Card>
        <Title>Loading...</Title>
      </Card>
    );
  }

  return (
    <Card>
      <Header>
        <Title>Manage Holidays & Special Events</Title>
        {!showForm && (
          <StyledButton $emphasize onClick={() => setShowForm(true)}>
            + Add Holiday
          </StyledButton>
        )}
      </Header>

      <Description>
        Define holidays and special events. Reservations during these dates will be
        subject to different cancellation policies (1 day fee regardless of timing).
      </Description>

      {showForm && (
        <FormCard>
          <FormTitle>{editingHoliday ? "Edit Holiday" : "Add New Holiday"}</FormTitle>
          <Form onSubmit={handleSubmit}>
            <Field>
              <Label>Holiday Name *</Label>
              <TextInput
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="e.g., Memorial Day Weekend"
              />
            </Field>

            <Grid>
              <Field>
                <Label>Start Date *</Label>
                <DateInput
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={updateField}
                />
              </Field>

              <Field>
                <Label>End Date *</Label>
                <DateInput
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={updateField}
                />
              </Field>
            </Grid>

            <Field>
              <Label>Description (Optional)</Label>
              <TextArea
                name="description"
                value={form.description}
                onChange={updateField}
                placeholder="Any additional details about this holiday..."
                rows={3}
              />
            </Field>

            <FormActions>
              <CancelButton type="button" onClick={resetForm}>
                Cancel
              </CancelButton>
              <StyledButton $emphasize type="submit">
                {editingHoliday ? "Update Holiday" : "Create Holiday"}
              </StyledButton>
            </FormActions>
          </Form>
        </FormCard>
      )}

      <HolidayList>
        {holidays.length === 0 ? (
          <EmptyState>
            <EmptyIcon>📅</EmptyIcon>
            <EmptyText>No holidays or special events defined yet.</EmptyText>
            <EmptySubtext>
              Add holidays to apply special cancellation policies.
            </EmptySubtext>
          </EmptyState>
        ) : (
          holidays.map((holiday) => (
            <HolidayCard key={holiday.holidayid}>
              <HolidayInfo>
                <HolidayName>{holiday.name}</HolidayName>
                <HolidayDates>
                  {formatDisplayDate(holiday.startdate)}
                  {holiday.startdate !== holiday.enddate && (
                    <> — {formatDisplayDate(holiday.enddate)}</>
                  )}
                </HolidayDates>
                {holiday.description && (
                  <HolidayDescription>{holiday.description}</HolidayDescription>
                )}
              </HolidayInfo>
              <HolidayActions>
                <EditButton onClick={() => handleEdit(holiday)}>Edit</EditButton>
                <DeleteButton onClick={() => handleDelete(holiday.holidayid)}>
                  Delete
                </DeleteButton>
              </HolidayActions>
            </HolidayCard>
          ))
        )}
      </HolidayList>
    </Card>
  );
}

// Styled Components
const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #0f172a;
`;

const Description = styled.p`
  margin: 0 0 24px 0;
  font-size: 0.9rem;
  color: #64748b;
  line-height: 1.5;
`;

const FormCard = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
`;

const FormTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  @media (max-width: 600px) {
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
  border: 1px solid #d1d5db;
  background: #fff;
  color: #0f172a;
  font-size: 0.95rem;
  transition: all 200ms ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const TextInput = styled.input`
  ${sharedInput}
`;

const DateInput = styled.input`
  ${sharedInput}
`;

const TextArea = styled.textarea`
  ${sharedInput}
  resize: vertical;
  font-family: inherit;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
`;

const CancelButton = styled.button`
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #f1f5f9;
  }
`;

const HolidayList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HolidayCard = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  transition: all 200ms ease;

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  }

  @media (max-width: 600px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`;

const HolidayInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const HolidayName = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #0f172a;
`;

const HolidayDates = styled.span`
  font-size: 0.875rem;
  color: #3b82f6;
  font-weight: 500;
`;

const HolidayDescription = styled.span`
  font-size: 0.825rem;
  color: #64748b;
  margin-top: 4px;
`;

const HolidayActions = styled.div`
  display: flex;
  gap: 8px;
`;

const EditButton = styled.button`
  background: #e0f2fe;
  color: #0369a1;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.825rem;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #bae6fd;
  }
`;

const DeleteButton = styled.button`
  background: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.825rem;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #fecaca;
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 24px;
  text-align: center;
`;

const EmptyIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 16px;
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
`;

const EmptySubtext = styled.p`
  margin: 8px 0 0 0;
  font-size: 0.875rem;
  color: #64748b;
`;

