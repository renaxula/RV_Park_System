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

// Define site type upgrade hierarchy with max lengths
const SITE_TYPE_HIERARCHY = [
  { type: "small RV parking", maxLength: 40 },
  { type: "medium RV parking", maxLength: 43 },
  { type: "Extended Lot", maxLength: 55 },
  { type: "large RV parking", maxLength: 65 },
];

const NON_UPGRADEABLE_TYPES = ["RV rental", "Tent", "dry storage"];

// Helper to extract RV size from notes
function extractRvSize(notes) {
  if (!notes) return null;
  const match = notes.match(/RV:\s*(\d+)/i);
  return match ? parseInt(match[1]) : null;
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

  const [originalDates, setOriginalDates] = useState({
    startDate: formatDateForInput(reservation?.startdate) || "",
    endDate: formatDateForInput(reservation?.enddate) || "",
  });

  const [cancellationFee, setCancellationFee] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [costPreview, setCostPreview] = useState(null);
  const [spots, setSpots] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const [upgradedSite, setUpgradedSite] = useState(null);
  const [currentSiteId, setCurrentSiteId] = useState(reservation?.siteid);
  const [datesChanged, setDatesChanged] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(null);

  useEffect(() => {
    let filter = "";
    if (form.startDate && form.startDate !== "") {
      filter += "?startDate=" + form.startDate;
    }
    if (form.endDate && form.endDate !== "") {
      filter += "&endDate=" + form.endDate;
    }
    setDateFilter(filter);
  }, [form.startDate, form.endDate]);

  useEffect(() => {
    // Check if dates have actually changed from original
    const hasDateChanged =
      form.startDate !== originalDates.startDate ||
      form.endDate !== originalDates.endDate;
    setDatesChanged(hasDateChanged);
  }, [form.startDate, form.endDate, originalDates]);

useEffect(() => {
  async function fetchSpots() {
    try {
      const res = await axios.get(
        `http://localhost:3000/api/availableSites${dateFilter}`
      );

      let availableSpots = res.data;

      // If dates changed, treat current reservation as available
      if (datesChanged && reservation) {
        const alreadyIncluded = availableSpots.some(
          spot => spot.siteid === reservation.siteid
        );

        if (!alreadyIncluded) {
          availableSpots = [
            ...availableSpots,
            {
              siteid: reservation.siteid,
              sitename: reservation.sitename,
              sitetype: reservation.sitetype,
            },
          ];
        }
      }

      setSpots(availableSpots);
    } catch (err) {
      console.error("Error fetching available spots:", err);
    }
  }

  if (dateFilter && datesChanged) {
    fetchSpots();
  }
}, [dateFilter, datesChanged, reservation]);

  useEffect(() => {
    if (!reservation || spots.length === 0 || !datesChanged) return;
    handleSiteAvailability();
  }, [spots, datesChanged]);

  function handleSiteAvailability() {
    if (!reservation || !datesChanged) return;

    // Check if this is a non-upgradeable site type
    if (NON_UPGRADEABLE_TYPES.includes(reservation.sitetype)) {
      const isCurrentSiteAvailable = spots.some(
        (spot) => spot.siteid === reservation.siteid
      );

      if (!isCurrentSiteAvailable) {
        setAvailabilityError(
          `Your ${reservation.sitetype} site is not available for the selected dates. Please choose different dates.`
        );
        setUpgradedSite(null);
        setCurrentSiteId(reservation.siteid);
        return;
      }
      // Site is available, clear any errors
      setAvailabilityError(null);
      setCurrentSiteId(reservation.siteid);
      setUpgradedSite(null);
      return;
    }

    // Check if current site is available
    const isCurrentSiteAvailable = spots.some(
      (spot) => spot.siteid === reservation.siteid
    );

    if (isCurrentSiteAvailable) {
      // Current site is available, no upgrade needed
      setAvailabilityError(null);
      setCurrentSiteId(reservation.siteid);
      setUpgradedSite(null);
      return;
    }

    // Current site not available - try to find best fit
    const rvSize = extractRvSize(reservation.notes);

    if (!rvSize) {
      // No RV size in notes, try to upgrade normally
      const currentTypeIndex = SITE_TYPE_HIERARCHY.findIndex(
        (item) => item.type === reservation.sitetype
      );

      if (currentTypeIndex === -1) {
        setAvailabilityError(
          `Your site is not available for the selected dates. Please choose different dates.`
        );
        setUpgradedSite(null);
        setCurrentSiteId(reservation.siteid);
        return;
      }

      // Look for next available tier
      for (let i = currentTypeIndex + 1; i < SITE_TYPE_HIERARCHY.length; i++) {
        const nextTierType = SITE_TYPE_HIERARCHY[i].type;
        const availableSiteInNextTier = spots.find(
          (spot) => spot.sitetype === nextTierType
        );

        if (availableSiteInNextTier) {
          setAvailabilityError(null);
          setCurrentSiteId(availableSiteInNextTier.siteid);
          setUpgradedSite({
            originalType: reservation.sitetype,
            newType: availableSiteInNextTier.sitetype,
            newSiteId: availableSiteInNextTier.siteid,
            newSiteName: availableSiteInNextTier.sitename,
          });
          return;
        }
      }

      // No upgrade available
      setAvailabilityError(
        `No suitable sites available for the selected dates. Please choose different dates.`
      );
      setUpgradedSite(null);
      setCurrentSiteId(reservation.siteid);
      return;
    }

    const currentTypeIndex = SITE_TYPE_HIERARCHY.findIndex(
      (tier) => tier.type === reservation.sitetype
    );

    // Only allow upgrades or same tier (never downgrade)
    const suitableSites = SITE_TYPE_HIERARCHY.filter(
      (tier, index) => tier.maxLength >= rvSize && index >= currentTypeIndex
    );

    if (suitableSites.length === 0) {
      setAvailabilityError(
        `Your RV (${rvSize}ft) is too large for any available sites.`
      );
      setUpgradedSite(null);
      setCurrentSiteId(reservation.siteid);
      return;
    }

    // Try to find the smallest available site that fits
    for (const tier of suitableSites) {
      const availableSite = spots.find((spot) => spot.sitetype === tier.type);

      if (availableSite) {
        // Found a suitable site
        if (availableSite.siteid === reservation.siteid) {
          // It's the same site
          setAvailabilityError(null);
          setCurrentSiteId(reservation.siteid);
          setUpgradedSite(null);
          return;
        } else {
          // Different site - this is an upgrade or downgrade
          setAvailabilityError(null);
          setCurrentSiteId(availableSite.siteid);
          setUpgradedSite({
            originalType: reservation.sitetype,
            newType: availableSite.sitetype,
            newSiteId: availableSite.siteid,
            newSiteName: availableSite.sitename,
          });
          return;
        }
      }
    }

    // No suitable sites available
    setAvailabilityError(
      `No sites available that can accommodate your ${rvSize}ft RV for the selected dates. Please choose different dates.`
    );
    setUpgradedSite(null);
    setCurrentSiteId(reservation.siteid);
  }

  // Fetch cancellation fee + initial cost
  useEffect(() => {
    if (!reservation) return;

    async function fetchData() {
      try {
        const c = await axios.get(
          `http://localhost:3000/api/cancellation-fee/${reservation.reservationid}`,
          { withCredentials: true }
        );
        setCancellationFee(c.data);

        // initial cost calculation
        const costRes = await axios.get(
          `http://localhost:3000/api/calculate-cost`,
          {
            params: {
              siteId: reservation.siteid,
              startDate: reservation.startdate,
              endDate: reservation.enddate,
            },
            withCredentials: true,
          }
        );
        setCostPreview(costRes.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchData();
  }, [reservation]);

  // Recompute cost whenever dates change or site is upgraded
  useEffect(() => {
    if (!form.startDate || !form.endDate || !datesChanged) return;

    async function fetchNewCost() {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/calculate-cost`,
          {
            params: {
              siteId: currentSiteId,
              startDate: form.startDate,
              endDate: form.endDate,
            },
            withCredentials: true,
          }
        );
        setCostPreview(res.data);
      } catch (err) {
        console.error(err);
      }
    }

    fetchNewCost();
  }, [form.startDate, form.endDate, currentSiteId, datesChanged]);

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

    const validation = validateReservationDates(form.startDate, form.endDate);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      // If site was upgraded, we need to handle it differently
      if (upgradedSite) {
        // Get the payment info first
        const paymentRes = await axios.get(
          `http://localhost:3000/api/payments/reservation/${reservation.reservationid}`,
          { withCredentials: true }
        );
        const payment = paymentRes.data;

        // Create new reservation with upgraded site FIRST
        const newReservationRes = await axios.post(
          `http://localhost:3000/reservations`,
          {
            siteId: currentSiteId,
            startDate: form.startDate,
            endDate: form.endDate,
            notes: reservation.notes || "",
          },
          { withCredentials: true }
        );

        // If there was a payment, create a new payment for the new reservation
        if (payment) {
          // Use the original payment's card info to create new payment
          await axios.post(
            `http://localhost:3000/api/payments`,
            {
              reservationId: newReservationRes.data.reservation.reservationid,
              amount: costPreview.totalCost,
              cardNumber: `************${payment.cardlastfour}`, // Use stored last 4 digits
              paymentType: "credit_card",
            },
            { withCredentials: true }
          );
        }

        // NOW delete old reservation (after new one is created with payment)
        await axios.delete(
          `http://localhost:3000/reservations/${reservation.reservationid}`,
          { withCredentials: true }
        );

        const diff = costPreview.totalCost - (cancellationFee?.paidAmount || 0);
        let message = `Reservation updated to ${upgradedSite.newType} - ${upgradedSite.newSiteName}!\n\n`;

        if (diff > 0) {
          message += `Additional amount owed: $${diff.toFixed(2)}`;
        } else if (diff < 0) {
          message += `Refund amount: $${Math.abs(diff).toFixed(2)}`;
        } else {
          message += "No price change.";
        }

        alert(message);
      } else {
        // Normal update - same site
        const res = await axios.put(
          `http://localhost:3000/reservations/${reservation.reservationid}`,
          {
            startDate: form.startDate,
            endDate: form.endDate,
          },
          { withCredentials: true }
        );

        const diff = costPreview.totalCost - (cancellationFee?.paidAmount || 0);

        if (diff > 0) {
          alert(
            `Reservation updated! Additional amount owed: $${diff.toFixed(2)}`
          );
        } else if (diff < 0) {
          alert(
            `Reservation updated! Refund amount: $${Math.abs(diff).toFixed(2)}`
          );
        } else {
          alert("Reservation updated — no price change.");
        }
      }

      navigate(homePage);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Error updating reservation");
    }
  }

  async function cancelReservation() {
    try {
      const refundRes = await axios.post(
        `http://localhost:3000/api/refund/${reservation.reservationid}`,
        {},
        { withCredentials: true }
      );

      await axios.delete(
        `http://localhost:3000/reservations/${reservation.reservationid}`,
        { withCredentials: true }
      );

      const refundInfo = refundRes.data;
      let message = "Reservation canceled successfully!\n\n";
      if (refundInfo.originalAmount > 0) {
        message += `Original Payment: $${parseFloat(
          refundInfo.originalAmount
        ).toFixed(2)}\n`;
        message += `Cancellation Fee: $${parseFloat(
          refundInfo.cancellationFee
        ).toFixed(2)}\n`;
        message += `Refund Amount: $${parseFloat(
          refundInfo.refundAmount
        ).toFixed(2)}\n\n`;
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
            <InfoValue>
              {upgradedSite ? upgradedSite.newSiteName : reservation.sitename}
              {upgradedSite && (
                <UpgradeIcon title="Site changed due to availability">
                  ⬆️
                </UpgradeIcon>
              )}
            </InfoValue>
          </InfoRow>
          <InfoRow>
            <InfoLabel>Site Type:</InfoLabel>
            <InfoValue>
              {upgradedSite ? upgradedSite.newType : reservation.sitetype}
            </InfoValue>
          </InfoRow>
          {upgradedSite && (
            <UpgradeNotice>
              ℹ️ Site changed from {upgradedSite.originalType} to{" "}
              {upgradedSite.newType} due to availability
            </UpgradeNotice>
          )}
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

        {availabilityError && (
          <ErrorNotice>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorText>{availabilityError}</ErrorText>
          </ErrorNotice>
        )}

        {/* Price summary */}
        {costPreview && !availabilityError && (
          <PriceBox>
            <p>
              Old Total:{" "}
              <strong>${cancellationFee?.paidAmount?.toFixed(2) || 0}</strong>
            </p>
            <p>
              New Total: <strong>${costPreview.totalCost.toFixed(2)}</strong>
            </p>
            <p>
              Difference:{" "}
              <strong
                style={{
                  color:
                    costPreview.totalCost - (cancellationFee?.paidAmount || 0) <
                    0
                      ? "green"
                      : "red",
                }}
              >
                {costPreview.totalCost - (cancellationFee?.paidAmount || 0) < 0
                  ? `Refund $${Math.abs(
                      costPreview.totalCost - (cancellationFee?.paidAmount || 0)
                    ).toFixed(2)}`
                  : `Charge $${(
                      costPreview.totalCost - (cancellationFee?.paidAmount || 0)
                    ).toFixed(2)}`}
              </strong>
            </p>
          </PriceBox>
        )}

        {cancellationFee && (
          <CancellationInfo>
            <CancellationTitle>Cancellation Policy</CancellationTitle>
            {cancellationFee.isHoliday && (
              <HolidayNotice>
                ⚠️ Holiday/Special Event:{" "}
                {cancellationFee.holidayNames.join(", ")}
              </HolidayNotice>
            )}
            <CancellationDetails>
              <DetailRow>
                <DetailLabel>Days until arrival:</DetailLabel>
                <DetailValue>{cancellationFee.daysUntilArrival}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Cancellation fee:</DetailLabel>
                <DetailValue>
                  ${parseFloat(cancellationFee.fee).toFixed(2)}
                </DetailValue>
              </DetailRow>
              {cancellationFee.paidAmount > 0 && (
                <>
                  <DetailRow>
                    <DetailLabel>Amount paid:</DetailLabel>
                    <DetailValue>
                      ${parseFloat(cancellationFee.paidAmount).toFixed(2)}
                    </DetailValue>
                  </DetailRow>
                  <DetailRow $highlight>
                    <DetailLabel>Refund amount:</DetailLabel>
                    <DetailValue>
                      ${parseFloat(cancellationFee.refundAmount).toFixed(2)}
                    </DetailValue>
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

          <SubmitButton type="submit" disabled={!!availabilityError}>
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
                    <span>
                      ${parseFloat(cancellationFee.refundAmount).toFixed(2)}
                    </span>
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

// ------- Pricing box -------
const PriceBox = styled.div`
  margin: 18px 0;
  padding: 16px;
  border: 1px solid #bbb;
  border-radius: 8px;
  background: #fafafa;
`;

// ------- Styled Components -------

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
  align-items: center;
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
  display: flex;
  align-items: center;
  gap: 6px;
`;

const UpgradeIcon = styled.span`
  font-size: 1rem;
  cursor: help;
`;

const UpgradeNotice = styled.div`
  background: #dbeafe;
  color: #1e40af;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 4px;
`;

const ErrorNotice = styled.div`
  background: #fee2e2;
  border: 1px solid #ef4444;
  color: #991b1b;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 8px;
`;

const ErrorIcon = styled.span`
  font-size: 1.1rem;
  flex-shrink: 0;
`;

const ErrorText = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.4;
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
  box-shadow: 0 1px 0 rgba(2, 6, 23, 0.02);

  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.9);
    box-shadow: 0 6px 18px rgba(59, 130, 246, 0.08);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
`;

const SubmitButton = styled.button`
  background: ${(props) => (props.disabled ? "#94a3b8" : "#045de9")};
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  font-weight: 600;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  transition: all 200ms ease;

  &:hover {
    opacity: ${(props) => (props.disabled ? 0.6 : 0.9)};
  }
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
  ${({ $highlight }) =>
    $highlight &&
    "background: #d1fae5; padding: 8px 10px; border-radius: 6px; margin-top: 4px;"}
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
