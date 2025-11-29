import { Card } from "../ui/Card";
import styled from "styled-components";
import { StyledButton } from "../ui/StyledButton";

export function ViewReservations() {
  return (
    <Card>
      <h3>View / Edit Reservations</h3>

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
          <Tr>
            <Td>123</Td>
            <Td>Jane Doe</Td>
            <Td>12</Td>
            <Td>2025-11-01</Td>
            <Td>2025-11-03</Td>
            <Td>
              <StyledButton href="#">Edit</StyledButton>
            </Td>
          </Tr>
        </tbody>
      </Table>
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

