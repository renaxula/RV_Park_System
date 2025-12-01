import { useEffect, useState } from "react";
import useApiReports from "./useApiReports";

function CurrentAvailability({ startDate, endDate }) {
  const [rows, setRows] = useState([]);
  const [dateFilter, setDateFilter] = useState("");
  const { isLoading, error, sendRequest: fetchSites } = useApiReports();

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

  //console.log(rows);
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
