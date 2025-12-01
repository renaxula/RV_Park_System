import { useEffect, useState } from "react";
import styled from "styled-components";
import { Card } from "../ui/Card";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../router/AuthContext";


export function ViewReservations() {
  const [reservations, setReservations] = useState([]);
  const { user } = useAuth();
  const userId = user.userId;

  useEffect(() => {
    async function fetchReservations() {
      try {
        const res = await axios.get(`http://localhost:3000/reservations/${userId}`);
        console.log("response: ", res.data);
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
              <Tr key={res.reservationid}>
                <Td>{res.reservationid}</Td>
                <Td>{res.userid}</Td>
                <Td>{res.siteid}</Td>
                <Td>{res.startdate}</Td>
                <Td>{res.enddate}</Td>
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
const SubHeader = styled.p`margin: 0; color: #475569; font-size: 0.95rem;`;