import { useState } from "react";
import CurrentOccupied from "../reports/CurrentOccupied";
import { Card } from "../ui/Card";
import styled from "styled-components";
import { exportToCsv } from "../../utils/exportCsv";

const ITEMS_PER_PAGE = 20;

export function OccupiedSitesReport(props) {
  const [dateSelect, setDateSelect] = useState("");
  const [reportData, setReportData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const updateFilterHandler = (event) => {
    setDateSelect(document.getElementById("filter").value);
  };

  const date = props.date ? props.date : "";

  // Filter data same as child component for accurate count
  const filteredData = reportData.filter((row) => row.daysleft != 0);
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleExport = () => {
    const columns = [
      { key: "lastname", header: "Last Name" },
      { key: "siteid", header: "Site" },
      { key: "daysleft", header: "Nights Left" },
      { key: "notes", header: "Notes" },
    ];
    const today = new Date().toISOString().split("T")[0];
    exportToCsv(filteredData, `occupied-sites-${today}`, columns);
  };

  const handleDataLoad = (data) => {
    setReportData(data);
    setCurrentPage(1); // Reset to first page when data changes
  };

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <Card>
      <HeaderRow>
        <h2>Occupied Sites Report</h2>
        <ExportButton onClick={handleExport} disabled={filteredData.length === 0}>
          Export CSV
        </ExportButton>
      </HeaderRow>
      <Table>
        {/* <p>Shows date, last name, site, nights, and reservation notes.</p>
        <label htmlFor="filter">Select Date: </label>
        <input type="date" id="filter" onChange={updateFilterHandler} /> */}

        <thead>
          <tr>
            <Th>Last Name</Th>
            <Th>Site</Th>
            <Th>Nights Left</Th>
            <Th>Notes</Th>
          </tr>
        </thead>
        <tbody>
          <CurrentOccupied
            filter={date}
            onDataLoad={handleDataLoad}
            currentPage={currentPage}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </tbody>
      </Table>
      {totalPages > 1 && (
        <PaginationControls>
          <PageButton onClick={goToPreviousPage} disabled={currentPage === 1}>
            ← Previous
          </PageButton>
          <PageInfo>
            Page {currentPage} of {totalPages}
          </PageInfo>
          <PageButton onClick={goToNextPage} disabled={currentPage === totalPages}>
            Next →
          </PageButton>
        </PaginationControls>
      )}
    </Card>
  );
}

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ExportButton = styled.button`
  padding: 8px 16px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #1d4ed8;
  }

  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

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

const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e6e6e6;
`;

const PageButton = styled.button`
  padding: 8px 16px;
  background: #f8f9fa;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #e5e7eb;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageInfo = styled.span`
  font-size: 0.9rem;
  color: #6b7280;
`;
