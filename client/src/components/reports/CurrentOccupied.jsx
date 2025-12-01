import { useState, useEffect } from "react";
import styled from "styled-components";
import useApiReports from "./useApiReports";

const CurrentOccupied = (props) => {
  const [rows, setRows] = useState([]);
  const { isLoading, error, sendRequest: fetchSites } = useApiReports();

  let filter = "";
  if (props.filter && props.filter !== "") {
    filter = `?date=${props.filter}`;
    console.log(filter);
  }
  const date = props.date;
  useEffect(() => {
    async function loadAvailability() {
      fetchSites(
        { url: `http://localhost:3000/api/occupied${filter}` },
        setRows
      );
      // //add '?date=YYYY-MM-DD' to get day other than today
      // //example: ...occupied?date=2025-11-14
    }

    loadAvailability();
    console.log("api Loaded");
  }, [filter]);

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