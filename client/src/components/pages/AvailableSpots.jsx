import { useEffect, useState } from "react";
import styled from "styled-components";
import { Card } from "../ui/Card";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export function AvailableSpots() {
  const navigate = useNavigate();
  const [spots, setSpots] = useState([]);

  useEffect(() => {
    async function fetchSpots() {
      try {
        const res = await axios.get("http://localhost:3000/available-spots");
        setSpots(res.data);
      } catch (err) {
        console.error("Error fetching available spots:", err);
      }
    }
    fetchSpots();
  }, []);

  const handleSelect = (spot) => {
    navigate("/make-reservation", { state: { spot } });
  };

  return (
    <Card>
      <Container>
        <Header>Available Spots</Header>
        <SubHeader>Quick list of spots currently available.</SubHeader>

        <SpotList>
          {spots.map((spot) => (
            <SpotItem key={spot.siteId} onClick={() => handleSelect(spot)}>
              <strong>{spot.siteName}</strong> — {spot.siteType} — ${spot.rate}/night
            </SpotItem>
          ))}
        </SpotList>
      </Container>
    </Card>
  );
}

/* Styled Components */
const Container = styled.div`display: flex; flex-direction: column; gap: 16px;`;
const Header = styled.h2`margin: 0; font-size: 1.5rem; font-weight: 600; color: #0f172a;`;
const SubHeader = styled.p`margin: 0; color: #475569; font-size: 0.95rem;`;
const SpotList = styled.ul`list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px;`;
const SpotItem = styled.li`
  padding: 12px 16px;
  border-radius: 8px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);

  &:hover {
    background: #e0f2fe;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  strong { color: #0f172a; }
`;
