import { useState } from "react";
import CurrentAvailability from "../reports/CurrentAvailability";
import { Card } from "../ui/Card";
import styled from "styled-components";
import { exportToCsv } from "../../utils/exportCsv";

const ITEMS_PER_PAGE = 20;

export function OpenSitesReport(props) {
  const [error, setError] = useState();
  const [reportData, setReportData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  //const [startDate, setStartDate] = useState();
  // const [endDate, setEndDate] = useState();

  // const createFilterHandler = (event) => {
  //   event.preventDefault();
  //   const start = document.getElementById("start").value;
  //   const end = document.getElementById("end").value;

  //   if (new Date(end) < new Date(start)) {
  //     setError("End must be after start");
  //     return;
  //   }
  //   if (start != end) {
  //     setStartDate(startDate);
  //     setEndDate(endDate);
  //   } else {
  //     setStartDate(start);
  //   }
  //   setError("");

  //   //console.log("start: " + startDate);
  //   //console.log("end: " + endDate);
  // };
  const start = props.date;

  const totalPages = Math.ceil(reportData.length / ITEMS_PER_PAGE);

  const handleExport = () => {
    // Transform data to match display format
    const exportData = reportData.map((row) => ({
      ...row,
      rateFormatted: `$${row.rate}/night`,
      daysFormatted: row.daysopen > 30 ? "Over a Month" : row.daysopen,
    }));

    const columns = [
      { key: "sitename", header: "Site" },
      { key: "sitetype", header: "Type" },
      { key: "rateFormatted", header: "Rate" },
      { key: "daysFormatted", header: "Days Available" },
    ];
    const today = new Date().toISOString().split("T")[0];
    exportToCsv(exportData, `open-sites-${today}`, columns);
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
        <h2>Open Sites Report</h2>
        <ExportButton onClick={handleExport} disabled={reportData.length === 0}>
          Export CSV
        </ExportButton>
      </HeaderRow>
      {/* <p>
        Shows which sites are available, nights available, and rate per night
        for each date. By default gets today's availability, use date selectors
        to get availability for different day/date range.
      </p> */}
      {/* <label htmlFor="start">Start: </label>
      <input type="date" id="start"  />
      <label htmlFor="end"> End: </label>
      <input type="date" id="end"  />
      <div>
        <button onClick={createFilterHandler}>Search</button>
        <p>{error}</p>
      </div> */}
      <Table>
        <thead>
          <tr>
            <Th>Site</Th>
            <Th>Type</Th>
            <Th>Rate</Th>
            <Th>Days available</Th>
          </tr>
        </thead>
        <tbody>
          <CurrentAvailability
            startDate={start}
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
