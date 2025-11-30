import { useState, useEffect } from "react";
import styled from "styled-components";

const CurrentOccupied = (props) => {
  const [rows, setRows] = useState([]);
  const date = props.date;
  useEffect(() => {
    async function loadAvailability() {
      const response = await fetch(
        `http://localhost:3000/api/occupied?date=${date}`
      );
      //add '?date=YYYY-MM-DD' to get day other than today
      //example: ...occupied?date=2025-11-14
      const data = await response.json();
      setRows(data);
    }
    loadAvailability();
  }, [date]);

  return (
    <>
      {rows.length == 0 ? (
        <Tr><Td>No Sites Occupied</Td></Tr>
      ) : (
        rows.map((row) => (
          <Tr key={row.siteid}>
            <Td>{row.lastname}</Td>
            <Td>{row.siteid}</Td>
            <Td>{row.daysleft}</Td>
            <Td>{row.notes}</Td>
          </Tr>
        ))
      )}
    </>
  );
};

export default CurrentOccupied;


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