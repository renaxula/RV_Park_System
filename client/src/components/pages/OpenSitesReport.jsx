import { useState } from "react";
import CurrentAvailability from "../reports/CurrentAvailability";
import { Card } from "../ui/Card";
import styled from "styled-components";

export function OpenSitesReport(props) {
  const [error, setError] = useState();
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

  return (
    <Card>
      <h2>Open Sites Report</h2>
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
          <CurrentAvailability startDate={start} />
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
