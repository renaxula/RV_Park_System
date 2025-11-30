import { useEffect, useState } from "react";
import styled from "styled-components";
import { Card } from "../ui/Card";
import { Link } from "react-router-dom";
import axios from "axios";

export function ViewReservations({ userId }) {
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    async function fetchReservations() {
      try {
        const res = await axios.get(`http://localhost:3000/reservations/${userId}`);
        setReservations(res.data);
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
        <SubHeader>List of current reservations with edit options.</SubHeader>

        <Table>
          <thead>
            <tr>
              <Th>Reservation ID</Th>
              <Th>Name</Th>
              <Th>Site</Th>
              <Th>Start</Th>
              <Th>End</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((res) => (
              <Tr key={res.reservationId}>
                <Td>{res.reservationId}</Td>
                <Td>{res.emailAddress}</Td>
                <Td>{res.siteId}</Td>
                <Td>{res.startDate}</Td>
                <Td>{res.endDate}</Td>
                <Td>
                  <EditLink
                    as={Link}
                    to="/edit-reservation"
                    state={{ reservation: res }}
                  >
                    Edit
                  </EditLink>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Container>
    </Card>
  );
}

/* Styled Components */

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Header = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #0f172a;
`;

const SubHeader = styled.p`
  margin: 0;
  color: #475569;
  font-size: 0.95rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 12px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
`;

const Th = styled.th`
  text-align: left;
  padding: 12px;
  background: #f1f5f9;
  font-weight: 600;
  color: #334155;
`;

const Td = styled.td`
  padding: 12px;
  border-top: 1px solid #e2e8f0;
  color: #0f172a;
`;

const Tr = styled.tr`
  &:nth-child(even) {
    background: #f9fafb;
  }

  &:hover {
    background: #e0f2fe;
  }
`;

const EditLink = styled.a`
  color: #045de9;
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
