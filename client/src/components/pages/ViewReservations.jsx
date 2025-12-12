import { useEffect, useState } from "react";
import styled from "styled-components";
import { Card } from "../ui/Card";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../router/AuthContext";
import { StyledButton } from "../ui/StyledButton";

export function ViewReservations() {
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState({});
  const [loadingPayment, setLoadingPayment] = useState(null);
  const { user } = useAuth();
  const userId = user.userId;
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchReservations() {
      try {
        const res = await axios.get(`http://localhost:3000/reservations/${userId}`);
        console.log("response: ", res.data);
        setReservations(res.data);
        
        // Fetch payment status for each reservation
        const paymentStatuses = {};
        for (const reservation of res.data) {
          try {
            const paymentRes = await axios.get(
              `http://localhost:3000/api/payments/reservation/${reservation.reservationid}`,
              { withCredentials: true }
            );
            if (paymentRes.data) {
              paymentStatuses[reservation.reservationid] = paymentRes.data;
            }
          } catch (err) {
            // No payment found, that's okay
          }
        }
        setPayments(paymentStatuses);
      } catch (err) {
        console.error("Error fetching reservations:", err);
      }
    }

    fetchReservations();
  }, [userId]);

  async function handlePayNow(reservation) {
    setLoadingPayment(reservation.reservationid);
    
    try {
      // Fetch cost details
      const costRes = await axios.get("http://localhost:3000/api/calculate-cost", {
        params: {
          siteId: reservation.siteid,
          startDate: reservation.startdate.split("T")[0],
          endDate: reservation.enddate.split("T")[0],
        },
      });

      // Check for holidays
      let isHoliday = false;
      let holidayNames = [];
      try {
        const holidayRes = await axios.get("http://localhost:3000/api/holidays/check", {
          params: {
            startDate: reservation.startdate.split("T")[0],
            endDate: reservation.enddate.split("T")[0],
          },
        });
        if (holidayRes.data.isHoliday) {
          isHoliday = true;
          holidayNames = holidayRes.data.holidays.map((h) => h.name);
        }
      } catch (err) {
        // Holiday check failed, continue without holiday info
      }

      // Navigate to payment page
      navigate("/payment", {
        state: {
          reservation: reservation,
          costDetails: costRes.data,
          spotDetails: {
            siteid: reservation.siteid,
            sitename: reservation.sitename,
            sitetype: reservation.sitetype,
          },
          isHoliday,
          holidayNames,
        },
      });
    } catch (err) {
      console.error("Error preparing payment:", err);
      alert("Failed to load payment details. Please try again.");
    } finally {
      setLoadingPayment(null);
    }
  }


  return (
    <Card>
      <Container>
        <Header>View / Edit Reservations</Header>
        <Table>
          <thead>
            <tr>
              <Th>Site</Th>
              <Th>Start</Th>
              <Th>End</Th>
              <Th>Payment</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => {
              const payment = payments[res.reservationid];
              return (
                <Tr key={res.reservationid}>
                  <Td>{res.sitename}</Td>
                  <Td>{res.startdate.split("T")[0]}</Td>
                  <Td>{res.enddate.split("T")[0]}</Td>
                  <Td>
                    {payment ? (
                      <PaymentBadge $status={payment.paymentstatus}>
                        {payment.paymentstatus === 'completed' && '✓ Paid'}
                        {payment.paymentstatus === 'refunded' && '↩ Refunded'}
                        {payment.paymentstatus === 'partial_refund' && '↩ Partial Refund'}
                        {!['completed', 'refunded', 'partial_refund'].includes(payment.paymentstatus) && payment.paymentstatus}
                        <PaymentAmount>${parseFloat(payment.amount).toFixed(2)}</PaymentAmount>
                      </PaymentBadge>
                    ) : (
                      <PaymentBadge $status="unpaid">⚠ Unpaid</PaymentBadge>
                    )}
                  </Td>
                  <Td>
                    <ActionButtons>
                      {!payment && (
                        <PayNowButton
                          onClick={() => handlePayNow(res)}
                          disabled={loadingPayment === res.reservationid}
                        >
                          {loadingPayment === res.reservationid ? "Loading..." : "Pay Now"}
                        </PayNowButton>
                      )}
                      <EditLink
                        as={Link}
                        to="/edit-reservation"
                        state={{ reservation: res }}
                      >
                        <StyledButton>Edit</StyledButton>
                      </EditLink>
                    </ActionButtons>
                  </Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Container>
    </Card>
  );
}


const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  font-size: 0.95rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 10px;
  border-bottom: 2px solid #ddd;
  background: #f8f9fa;
  font-weight: 600;
`;

const Td = styled.td`
  padding: 10px 10px;
  border-bottom: 1px solid #e6e6e6;
`;

const Tr = styled.tr`
  &:nth-child(even) {
    background: #fafafa;
  }

  &:hover {
    background: #f0f4ff;
  }
`;

const EditLink = styled.a`
  color: #0077ff;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    text-decoration: underline;
  }
`;

const Container = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const Header = styled.h2`margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a;`;

const PaymentBadge = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${({ $status }) => {
    switch ($status) {
      case 'completed': return '#dcfce7';
      case 'refunded': return '#e0e7ff';
      case 'partial_refund': return '#fef3c7';
      case 'unpaid': return '#fee2e2';
      default: return '#f1f5f9';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'completed': return '#166534';
      case 'refunded': return '#3730a3';
      case 'partial_refund': return '#92400e';
      case 'unpaid': return '#dc2626';
      default: return '#475569';
    }
  }};
`;

const PaymentAmount = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.8;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const PayNowButton = styled.button`
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #047857 0%, #059669 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;