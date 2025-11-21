import { useEffect, useState } from "react";

function CurrentAvailability() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function loadAvailability() {
      const response = await fetch("http://localhost:3000/api/availableSites");
      //add '?startDate=YYYY-MM-DD' to get day other than today
      //example: .../availableSites?startDate=2025-11-14
      //also: &endDate=yyyy-mm-dd.
      const data = await response.json();
      //console.log("Data: ");
      //console.log(data);
      setRows(data);
    }
    loadAvailability();
  }, []);

  console.log(rows);
  return (
    <>
      <ul>
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
