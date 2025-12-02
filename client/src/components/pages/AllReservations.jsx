import { useEffect, useState } from "react";
import styled from "styled-components";
import { Card } from "../ui/Card";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../router/AuthContext";
import { StyledButton } from "../ui/StyledButton";

export function AllReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    async function fetchReservations() {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:3000/reservations", {
          withCredentials: true
        });
        setReservations(res.data);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setError(err.response?.data?.error || "Failed to load reservations");
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, []);

  // Filter reservations by username or site name
  const filteredReservations = reservations.filter((res) => {
    if (!filter) return true;
    const searchTerm = filter.toLowerCase();
    return (
      res.username?.toLowerCase().includes(searchTerm) ||
      res.firstname?.toLowerCase().includes(searchTerm) ||
      res.lastname?.toLowerCase().includes(searchTerm) ||
      res.sitename?.toLowerCase().includes(searchTerm)
    );
  });

  if (loading) {
    return <Card><p>Loading reservations...</p></Card>;
  }

  if (error) {
    return <Card><p style={{ color: "red" }}>{error}</p></Card>;
  }

  return (
    <Card>
      <Container>
        <Header>All Reservations (Staff View)</Header>
        
        <SearchBox>
          <SearchInput
            type="text"
            placeholder="Search by username, name, or site..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </SearchBox>

        <Table>
          <thead>
            <tr>
              <Th>User</Th>
              <Th>Site</Th>
              <Th>Type</Th>
              <Th>Start</Th>
              <Th>End</Th>
              <Th>Notes</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filteredReservations.length === 0 ? (
              <tr>
                <Td colSpan="7" style={{ textAlign: "center" }}>
                  No reservations found
                </Td>
              </tr>
            ) : (
              filteredReservations.map((res) => (
                <Tr key={res.reservationid}>
                  <Td>
                    <strong>{res.username}</strong>
                    <br />
                    <small>{res.firstname} {res.lastname}</small>
                  </Td>
                  <Td>{res.sitename}</Td>
                  <Td>{res.sitetype}</Td>
                  <Td>{res.startdate?.split("T")[0]}</Td>
                  <Td>{res.enddate?.split("T")[0]}</Td>
                  <Td><NotesCell>{res.notes || "-"}</NotesCell></Td>
                  <Td>
                    <Link
                      to="/edit-reservation"
                      state={{ reservation: res }}
                    >
                      <StyledButton $emphasize={true}>
                        Edit
                      </StyledButton>
                    </Link>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
        
        <Summary>
          Showing {filteredReservations.length} of {reservations.length} reservations
        </Summary>
      </Container>
    </Card>
  );
}

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

const SearchBox = styled.div`
  display: flex;
  gap: 8px;
`;

const SearchInput = styled.input`
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  font-size: 0.95rem;
  
  &:focus {
    outline: none;
    border-color: rgba(59, 130, 246, 0.9);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 12px 8px;
  border-bottom: 2px solid #ddd;
  background: #f8f9fa;
  font-weight: 600;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 10px 8px;
  border-bottom: 1px solid #e6e6e6;
  vertical-align: top;
`;

const Tr = styled.tr`
  &:nth-child(even) {
    background: #fafafa;
  }

  &:hover {
    background: #f0f4ff;
  }
`;


const NotesCell = styled.div`
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Summary = styled.p`
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
`;

