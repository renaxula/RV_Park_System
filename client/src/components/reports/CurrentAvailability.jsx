import { useEffect, useState } from "react";
import styled from "styled-components";
import useApiReports from "./useApiReports";

function CurrentAvailability(props) {
  const [rows, setRows] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const { isLoading, error, sendRequest: fetchSites } = useApiReports();
  const date = props?.date;

  useEffect(() => {
    let filter = "";
    if (date && date !== "") {
      filter += "?startDate=" + date + "&endDate=" + date;
    }
    setDateFilter(filter);
  }, [date]);

  useEffect(() => {
    async function loadAvailability() {
      fetchSites(
        {
          url: `http://localhost:3000/api/availableSites${dateFilter}`,
        },
        setRows
      );
      // //add '?startDate=YYYY-MM-DD' to get day other than today
      // //example: .../availableSites?startDate=2025-11-14
      // //also: &endDate=yyyy-mm-dd.
    }
    loadAvailability();
  }, [dateFilter]);

  // If no rows, show "No Open Sites"
  if (rows.length === 0) {
    return (
      <Tr>
        <Td>No Open Sites</Td>
      </Tr>
    );
  }

  return (
    <>
      {rows.map((row) => {
        if (row.daysopen === 0) {
          return null;
        }

        return (
          <Tr key={row.siteid}>
            <Td>{row.sitename}</Td>
            <Td>{row.sitetype}</Td>
            <Td>${row.rate}/night</Td>
            <Td>{row.daysopen > 30 ? "Over a Month" : row.daysopen}</Td>
          </Tr>
        );
      })}
    </>
  );
}

export default CurrentAvailability;

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
