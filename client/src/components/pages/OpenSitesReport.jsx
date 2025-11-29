import { useState } from "react";
import CurrentAvailability from "../reports/CurrentAvailability";
import { Card } from "../ui/Card";

export function OpenSitesReport() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState();

  const createFilterHandler = (event) => {
    event.preventDefault();
    const start = document.getElementById("start").value;
    const end = document.getElementById("end").value;

    if (new Date(end) < new Date(start)) {
      setError("End must be after start");
      return;
    }
    if (start != end) {
      setStartDate(start);
      setEndDate(end);
    } else {
      setStartDate(start);
    }
    setError("");

    //console.log("start: " + startDate);
    //console.log("end: " + endDate);
  };

  return (
    <Card>
      <h2>Open Sites Report</h2>
      <p>
        Shows which sites are available, nights available, and rate per night
        for each date. By default gets today's availability, use date selectors
        to get availability for different day/date range.
      </p>
      <label htmlFor="start">Start: </label>
      <input type="date" id="start" name="start" />
      <label htmlFor="end"> End: </label>
      <input type="date" id="end" name="end" />
      <div>
        <button onClick={createFilterHandler}>Search</button>
        <p>{error}</p>
      </div>
      <CurrentAvailability startDate={startDate} endDate={endDate} />
    </Card>
  );
}
