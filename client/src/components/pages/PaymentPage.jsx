import styled from "styled-components";
import axios from "axios";
import { Card } from "../ui/Card";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { StyledButton } from "../ui/StyledButton";
import { useAuth } from "../router/AuthContext";

export function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { homePage, user, isPendingAccount } = useAuth();
  
  const { reservation, costDetails, spotDetails, isHoliday, holidayNames, isGuestCheckout } = location.state || {};
  
  const [form, setForm] = useState({
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardName: "",
  });
  
  const [processing, setProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  if (!reservation || !costDetails) {
    return (
      <Card>
        <Title>No Reservation Found</Title>
        <p>Please make a reservation first.</p>
        <StyledButton onClick={() => navigate("/make-reservation")}>
          Make Reservation
        </StyledButton>
      </Card>
    );
  }

  function updateField(e) {
    let { name, value } = e.target;
    
    // Format card number with spaces
    if (name === "cardNumber") {
      value = value.replace(/\s/g, "").replace(/(\d{4})/g, "$1 ").trim();
      if (value.length > 19) value = value.slice(0, 19);
    }
    
    // Format expiry as MM/YY
    if (name === "cardExpiry") {
      value = value.replace(/\D/g, "");
      if (value.length >= 2) {
        value = value.slice(0, 2) + "/" + value.slice(2, 4);
      }
    }
    
    // Limit CVV to 4 digits
    if (name === "cardCvv") {
      value = value.replace(/\D/g, "").slice(0, 4);
    }
    
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!form.cardNumber || !form.cardExpiry || !form.cardCvv || !form.cardName) {
      alert("Please fill in all payment fields");
      return;
    }

    setProcessing(true);

    try {
      const res = await axios.post(
        "http://localhost:3000/api/payments",
        {
          reservationId: reservation.reservationid,
          amount: costDetails.totalCost,
          cardNumber: form.cardNumber,
          cardExpiry: form.cardExpiry,
          cardCvv: form.cardCvv,
          cardName: form.cardName,
        },
        { withCredentials: true }
      );

      setReceiptData({
        ...res.data.receipt,
        reservation,
        costDetails,
        spotDetails,
        cardName: form.cardName,
        isHoliday,
        holidayNames,
      });
      setShowReceipt(true);
    } catch (err) {
      console.error("Payment error:", err);
      alert(err.response?.data?.error || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  if (showReceipt && receiptData) {
    // If guest checkout, redirect to complete registration
    const handleReceiptClose = () => {
      if (isGuestCheckout || isPendingAccount) {
        navigate('/complete-registration', { 
          state: { receiptData } 
        });
      } else {
        navigate(homePage);
      }
    };
    
    return (
      <Receipt 
        data={receiptData} 
        onClose={handleReceiptClose}
        isGuestCheckout={isGuestCheckout || isPendingAccount}
      />
    );
  }

  return (
    <Card>
      <Form onSubmit={handleSubmit}>
        <Title>Complete Your Payment</Title>
        
        <OrderSummary>
          <SummaryTitle>Reservation Summary</SummaryTitle>
          <SummaryRow>
            <SummaryLabel>Site:</SummaryLabel>
            <SummaryValue>{spotDetails?.sitename || "N/A"} ({spotDetails?.sitetype})</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Check-in:</SummaryLabel>
            <SummaryValue>{new Date(reservation.startdate).toLocaleDateString()}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Check-out:</SummaryLabel>
            <SummaryValue>{new Date(reservation.enddate).toLocaleDateString()}</SummaryValue>
          </SummaryRow>
          <SummaryRow>
            <SummaryLabel>Duration:</SummaryLabel>
            <SummaryValue>{costDetails.nights} night{costDetails.nights > 1 ? "s" : ""}</SummaryValue>
          </SummaryRow>
          {isHoliday && (
            <HolidayBadge>
              🎉 Holiday: {holidayNames.join(", ")}
            </HolidayBadge>
          )}
          <SummaryDivider />
          <SummaryRow $total>
            <SummaryLabel>Total Due:</SummaryLabel>
            <SummaryValue>${parseFloat(costDetails.totalCost).toFixed(2)}</SummaryValue>
          </SummaryRow>
        </OrderSummary>

        <PaymentSection>
          <SectionTitle>Payment Details</SectionTitle>
          <MockBadge>Mock Payment System</MockBadge>
          
          <Field>
            <Label>Cardholder Name</Label>
            <TextInput
              name="cardName"
              value={form.cardName}
              onChange={updateField}
              placeholder="John Doe"
              autoComplete="cc-name"
            />
          </Field>

          <Field>
            <Label>Card Number</Label>
            <TextInput
              name="cardNumber"
              value={form.cardNumber}
              onChange={updateField}
              placeholder="1234 5678 9012 3456"
              autoComplete="cc-number"
            />
          </Field>

          <Grid>
            <Field>
              <Label>Expiry Date</Label>
              <TextInput
                name="cardExpiry"
                value={form.cardExpiry}
                onChange={updateField}
                placeholder="MM/YY"
                autoComplete="cc-exp"
              />
            </Field>

            <Field>
              <Label>CVV</Label>
              <TextInput
                name="cardCvv"
                value={form.cardCvv}
                onChange={updateField}
                placeholder="123"
                type="password"
                autoComplete="cc-csc"
              />
            </Field>
          </Grid>
        </PaymentSection>

        <CancellationPolicy>
          <PolicyTitle>Cancellation Policy</PolicyTitle>
          <PolicyText>
            • 3+ days before arrival: $10 cancellation fee<br />
            • Less than 3 days: 1 night fee<br />
            {isHoliday && "• Holiday reservations: 1 night fee (any time)"}
          </PolicyText>
        </CancellationPolicy>

        <Actions>
          <CancelButton type="button" onClick={() => navigate(-1)}>
            Back
          </CancelButton>
          <StyledButton $emphasize type="submit" disabled={processing}>
            {processing ? "Processing..." : `Pay $${parseFloat(costDetails.totalCost).toFixed(2)}`}
          </StyledButton>
        </Actions>
      </Form>
    </Card>
  );
}

// Receipt Component
function Receipt({ data, onClose, isGuestCheckout }) {
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <ReceiptCard>
      <ReceiptHeader>
        <ReceiptTitle>Payment Confirmed!</ReceiptTitle>
        <ReceiptSubtitle>Thank you for your reservation</ReceiptSubtitle>
      </ReceiptHeader>

      <ReceiptBody>
        <ReceiptSection>
          <ReceiptSectionTitle>Reservation Details</ReceiptSectionTitle>
          <ReceiptRow>
            <ReceiptLabel>Confirmation #:</ReceiptLabel>
            <ReceiptValue>RVP-{data.reservation.reservationid.toString().padStart(6, "0")}</ReceiptValue>
          </ReceiptRow>
          <ReceiptRow>
            <ReceiptLabel>Site:</ReceiptLabel>
            <ReceiptValue>{data.spotDetails?.sitename} ({data.spotDetails?.sitetype})</ReceiptValue>
          </ReceiptRow>
          <ReceiptRow>
            <ReceiptLabel>Check-in:</ReceiptLabel>
            <ReceiptValue>{formatDate(data.reservation.startdate)}</ReceiptValue>
          </ReceiptRow>
          <ReceiptRow>
            <ReceiptLabel>Check-out:</ReceiptLabel>
            <ReceiptValue>{formatDate(data.reservation.enddate)}</ReceiptValue>
          </ReceiptRow>
          <ReceiptRow>
            <ReceiptLabel>Duration:</ReceiptLabel>
            <ReceiptValue>{data.costDetails.nights} night{data.costDetails.nights > 1 ? "s" : ""}</ReceiptValue>
          </ReceiptRow>
          {data.isHoliday && (
            <ReceiptRow>
              <ReceiptLabel>Special Event:</ReceiptLabel>
              <ReceiptValue>{data.holidayNames.join(", ")}</ReceiptValue>
            </ReceiptRow>
          )}
        </ReceiptSection>

        <ReceiptSection>
          <ReceiptSectionTitle>Payment Details</ReceiptSectionTitle>
          <ReceiptRow>
            <ReceiptLabel>Payment ID:</ReceiptLabel>
            <ReceiptValue>TXN-{data.paymentId.toString().padStart(8, "0")}</ReceiptValue>
          </ReceiptRow>
          <ReceiptRow>
            <ReceiptLabel>Card:</ReceiptLabel>
            <ReceiptValue>•••• •••• •••• {data.cardLastFour}</ReceiptValue>
          </ReceiptRow>
          <ReceiptRow>
            <ReceiptLabel>Cardholder:</ReceiptLabel>
            <ReceiptValue>{data.cardName}</ReceiptValue>
          </ReceiptRow>
          <ReceiptRow>
            <ReceiptLabel>Date:</ReceiptLabel>
            <ReceiptValue>{new Date(data.transactionDate).toLocaleString()}</ReceiptValue>
          </ReceiptRow>
        </ReceiptSection>

        <ReceiptTotal>
          <ReceiptTotalRow>
            <span>Rate: ${parseFloat(data.costDetails.rate).toFixed(2)}/night × {data.costDetails.nights} nights</span>
          </ReceiptTotalRow>
          <ReceiptTotalAmount>
            <span>Amount Paid:</span>
            <span>${parseFloat(data.amount).toFixed(2)}</span>
          </ReceiptTotalAmount>
        </ReceiptTotal>
      </ReceiptBody>

      <ReceiptFooter>
        {isGuestCheckout ? (
          <>
            <GuestNotice>
              <strong>One more step!</strong>
              <br />
              Set a password to access your account and manage your reservation.
            </GuestNotice>
            <StyledButton $emphasize onClick={onClose}>
              Complete Account Setup
            </StyledButton>
          </>
        ) : (
          <>
            <ReceiptNote>
              A copy of this receipt has been saved to your account.
              <br />
              Please save or print this page for your records.
            </ReceiptNote>
            <StyledButton $emphasize onClick={onClose}>
              Done
            </StyledButton>
          </>
        )}
      </ReceiptFooter>
    </ReceiptCard>
  );
}

// Styled Components
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #0f172a;
`;

const OrderSummary = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #e2e8f0;
`;

const SummaryTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
`;

const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: ${({ $total }) => ($total ? "1.15rem" : "0.95rem")};
  font-weight: ${({ $total }) => ($total ? "700" : "500")};
  color: ${({ $total }) => ($total ? "#0f172a" : "#475569")};
`;

const SummaryLabel = styled.span``;
const SummaryValue = styled.span``;

const SummaryDivider = styled.hr`
  border: none;
  border-top: 1px solid #cbd5e1;
  margin: 12px 0;
`;

const HolidayBadge = styled.div`
  display: inline-block;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 8px;
`;

const PaymentSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #334155;
`;

const MockBadge = styled.div`
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
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

const TextInput = styled.input`
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #0f172a;
  font-size: 1rem;
  font-family: "SF Mono", "Monaco", monospace;
  letter-spacing: 0.5px;
  transition: all 200ms ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
  }

  &::placeholder {
    color: #9ca3af;
    font-family: inherit;
  }
`;

const CancellationPolicy = styled.div`
  background: #fefce8;
  border: 1px solid #fde047;
  border-radius: 10px;
  padding: 14px 16px;
`;

const PolicyTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #854d0e;
`;

const PolicyText = styled.p`
  margin: 0;
  font-size: 0.825rem;
  color: #a16207;
  line-height: 1.6;
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 16px;
`;

const CancelButton = styled.button`
  background: transparent;
  color: #64748b;
  border: 1px solid #cbd5e1;
  padding: 12px 24px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }
`;

// Receipt Styled Components
const ReceiptCard = styled.div`
  background: #fff;
  border-radius: 16px;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15));
  margin-top: 2rem;
  overflow: hidden;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const ReceiptHeader = styled.div`
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  padding: 32px 24px;
  text-align: center;
  color: white;
`;

const ReceiptTitle = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
`;

const ReceiptSubtitle = styled.p`
  margin: 8px 0 0 0;
  opacity: 0.9;
  font-size: 1rem;
`;

const ReceiptBody = styled.div`
  padding: 24px;
`;

const ReceiptSection = styled.div`
  margin-bottom: 24px;
`;

const ReceiptSectionTitle = styled.h3`
  margin: 0 0 14px 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ReceiptRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;

  &:last-child {
    border-bottom: none;
  }
`;

const ReceiptLabel = styled.span`
  color: #64748b;
  font-size: 0.925rem;
`;

const ReceiptValue = styled.span`
  color: #0f172a;
  font-weight: 600;
  font-size: 0.925rem;
`;

const ReceiptTotal = styled.div`
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 12px;
  padding: 16px;
  margin-top: 8px;
`;

const ReceiptTotalRow = styled.div`
  font-size: 0.875rem;
  color: #166534;
  margin-bottom: 8px;
`;

const ReceiptTotalAmount = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 700;
  color: #059669;
`;

const ReceiptFooter = styled.div`
  padding: 20px 24px 24px;
  text-align: center;
  border-top: 1px dashed #e2e8f0;
`;

const ReceiptNote = styled.p`
  margin: 0 0 16px 0;
  font-size: 0.825rem;
  color: #94a3b8;
  line-height: 1.5;
`;

const GuestNotice = styled.div`
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border: 1px solid #3b82f6;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
  color: #1e40af;
  font-size: 0.9rem;
  line-height: 1.5;
`;

