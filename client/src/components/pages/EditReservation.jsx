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
    return { valid: false, error: "Reservations can only be made up to 6 months in advance" };
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
      error: "Reservations during peak season (April - October) are limited to 14 days" 
    };
  }

  return { valid: true };
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

  const [cancellationFee, setCancellationFee] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Fetch cancellation fee info when component mounts
  useEffect(() => {
    if (!reservation) return;

    async function fetchCancellationFee() {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/cancellation-fee/${reservation.reservationid}`,
          { withCredentials: true }
        );
        setCancellationFee(res.data);
      } catch (err) {
        console.error("Error fetching cancellation fee:", err);
      }
    }

    fetchCancellationFee();
  }, [reservation]);

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

    // Validate reservation dates
    const validation = validateReservationDates(form.startDate, form.endDate);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

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
    try {
      // First process the refund
      const refundRes = await axios.post(
        `http://localhost:3000/api/refund/${reservation.reservationid}`,
        {},
        { withCredentials: true }
      );

      // Then delete the reservation
      await axios.delete(
        `http://localhost:3000/reservations/${reservation.reservationid}`,
        { withCredentials: true }
      );

      // Show refund summary
      const refundInfo = refundRes.data;
      let message = "Reservation canceled successfully!\n\n";
      if (refundInfo.originalAmount > 0) {
        message += `Original Payment: $${parseFloat(refundInfo.originalAmount).toFixed(2)}\n`;
        message += `Cancellation Fee: $${parseFloat(refundInfo.cancellationFee).toFixed(2)}\n`;
        message += `Refund Amount: $${parseFloat(refundInfo.refundAmount).toFixed(2)}\n\n`;
        message += `Reason: ${refundInfo.reason}`;
      } else {
        message += "No payment was found for this reservation.";
      }
      alert(message);
      navigate(homePage);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error canceling reservation");
    }
  }

  function handleCancelClick() {
    setShowCancelConfirm(true);
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

        {cancellationFee && (
          <CancellationInfo>
            <CancellationTitle>Cancellation Policy</CancellationTitle>
            {cancellationFee.isHoliday && (
              <HolidayNotice>
                ⚠️ Holiday/Special Event: {cancellationFee.holidayNames.join(", ")}
              </HolidayNotice>
            )}
            <CancellationDetails>
              <DetailRow>
                <DetailLabel>Days until arrival:</DetailLabel>
                <DetailValue>{cancellationFee.daysUntilArrival}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Cancellation fee:</DetailLabel>
                <DetailValue>${parseFloat(cancellationFee.fee).toFixed(2)}</DetailValue>
              </DetailRow>
              {cancellationFee.paidAmount > 0 && (
                <>
                  <DetailRow>
                    <DetailLabel>Amount paid:</DetailLabel>
                    <DetailValue>${parseFloat(cancellationFee.paidAmount).toFixed(2)}</DetailValue>
                  </DetailRow>
                  <DetailRow $highlight>
                    <DetailLabel>Refund amount:</DetailLabel>
                    <DetailValue>${parseFloat(cancellationFee.refundAmount).toFixed(2)}</DetailValue>
                  </DetailRow>
                </>
              )}
              <CancellationReason>{cancellationFee.reason}</CancellationReason>
            </CancellationDetails>
          </CancellationInfo>
        )}

        <Actions>
          <CancelButton type="button" onClick={handleCancelClick}>
            Cancel Reservation
          </CancelButton>

          <SubmitButton type="submit">
            Save Changes
          </SubmitButton>
        </Actions>

      </Form>

      {showCancelConfirm && (
        <ModalOverlay onClick={() => setShowCancelConfirm(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Confirm Cancellation</ModalTitle>
            <ModalText>
              Are you sure you want to cancel this reservation?
            </ModalText>
            {cancellationFee && (
              <ModalFeeInfo>
                <ModalFeeRow>
                  <span>Cancellation Fee:</span>
                  <span>${parseFloat(cancellationFee.fee).toFixed(2)}</span>
                </ModalFeeRow>
                {cancellationFee.paidAmount > 0 && (
                  <ModalFeeRow $refund>
                    <span>You will receive:</span>
                    <span>${parseFloat(cancellationFee.refundAmount).toFixed(2)}</span>
                  </ModalFeeRow>
                )}
              </ModalFeeInfo>
            )}
            <ModalActions>
              <ModalCancelBtn onClick={() => setShowCancelConfirm(false)}>
                Keep Reservation
              </ModalCancelBtn>
              <ModalConfirmBtn onClick={cancelReservation}>
                Yes, Cancel
              </ModalConfirmBtn>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
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

const CancellationInfo = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 1px solid #f59e0b;
  border-radius: 10px;
  padding: 16px;
  margin-top: 8px;
`;

const CancellationTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #92400e;
`;

const HolidayNotice = styled.div`
  background: #fef9c3;
  color: #854d0e;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 12px;
`;

const CancellationDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: ${({ $highlight }) => ($highlight ? "#065f46" : "#78350f")};
  font-weight: ${({ $highlight }) => ($highlight ? "700" : "500")};
  ${({ $highlight }) => $highlight && "background: #d1fae5; padding: 8px 10px; border-radius: 6px; margin-top: 4px;"}
`;

const DetailLabel = styled.span``;
const DetailValue = styled.span`
  font-family: "SF Mono", monospace;
`;

const CancellationReason = styled.p`
  margin: 10px 0 0 0;
  font-size: 0.825rem;
  color: #a16207;
  font-style: italic;
`;

// Modal styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 16px;
  padding: 28px;
  max-width: 420px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalTitle = styled.h3`
  margin: 0 0 12px 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #0f172a;
`;

const ModalText = styled.p`
  margin: 0 0 20px 0;
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.5;
`;

const ModalFeeInfo = styled.div`
  background: #f8fafc;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 20px;
`;

const ModalFeeRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  padding: 6px 0;
  color: ${({ $refund }) => ($refund ? "#059669" : "#334155")};
  font-weight: ${({ $refund }) => ($refund ? "700" : "500")};
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const ModalCancelBtn = styled.button`
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

const ModalConfirmBtn = styled.button`
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #b91c1c;
  }
`;
