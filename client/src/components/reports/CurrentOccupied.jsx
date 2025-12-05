import { useState, useEffect } from "react";
import styled from "styled-components";
import useApiReports from "./useApiReports";

const CurrentOccupied = ({
  filter: filterProp,
  onDataLoad,
  currentPage = 1,
  itemsPerPage = 20,
}) => {
  const [rows, setRows] = useState([]);
  const { isLoading, error, sendRequest: fetchSites } = useApiReports();

  let filter = "";
  if (filterProp && filterProp !== "") {
    filter = `?date=${filterProp}`;
    console.log(filter);
  }

  useEffect(() => {
    async function loadAvailability() {
      fetchSites(
        { url: `http://localhost:3000/api/occupied${filter}` },
        (data) => {
          setRows(data);
          if (onDataLoad) onDataLoad(data);
        }
      );
      // //add '?date=YYYY-MM-DD' to get day other than today
      // //example: ...occupied?date=2025-11-14
    }

    loadAvailability();
    console.log("api Loaded");
  }, [filter]);

  // Filter out rows with daysleft == 0 first, then paginate
  const filteredRows = rows.filter((row) => row.daysleft != 0);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRows = filteredRows.slice(startIndex, startIndex + itemsPerPage);

  return (
    <>
      {filteredRows.length === 0 ? (
        <Tr>
          <Td>No Sites Occupied</Td>
        </Tr>
      ) : (
        paginatedRows.map((row) => (
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
