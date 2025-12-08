import { useEffect, useState } from "react";
import styled from "styled-components";
import { Card } from "../ui/Card";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../router/AuthContext";
import { StyledButton } from "../ui/StyledButton";

export function ViewReservations() {
  const [reservations, setReservations] = useState([]);
  const [payments, setPayments] = useState({});
  const { user } = useAuth();
  const userId = user.userId;

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
                    <EditLink
                      as={Link}
                      to="/edit-reservation"
                      state={{ reservation: res }}
                    >
                      <StyledButton>Edit</StyledButton>
                    </EditLink>
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