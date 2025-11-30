import { useEffect, useState } from "react";

function CurrentAvailability({ startDate, endDate }) {
  const [rows, setRows] = useState([]);
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (startDate && startDate !== "") {
      let filter = "?startDate=" + startDate;
      if (endDate && endDate !== "") {
        filter += "&endDate=" + endDate;
      }
      console.log(filter);
      setDateFilter(filter);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    async function loadAvailability() {
      const response = await fetch(
        `http://localhost:3000/api/availableSites${dateFilter}`
      );
      //add '?startDate=YYYY-MM-DD' to get day other than today
      //example: .../availableSites?startDate=2025-11-14
      //also: &endDate=yyyy-mm-dd.
      const data = await response.json();
      //console.log("Data: ");
      //console.log(data);
      setRows(data);
    }
    loadAvailability();
  }, [dateFilter]);

  return (
    <>
      <ul>
        {rows.length == 0 && <p>No Open Sites</p>}
        {rows.map((row) => (
          <li key={row.siteid}>
            Site {row.sitename} — {row.sitetype} — ${row.rate}/night — Days
            Available: {row.daysopen > 30 ? "Over a Month" : row.daysopen}
          </li>
        ))}
      </ul>
    </>
  );
}

export default CurrentAvailability;
