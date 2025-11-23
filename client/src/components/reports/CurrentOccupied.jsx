import { useState, useEffect } from "react";

const CurrentOccupied = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    async function loadAvailability() {
      const response = await fetch(
        "http://localhost:3000/api/occupied?date=2025-11-14"
      );
      //add '?date=YYYY-MM-DD' to get day other than today
      //example: ...occupied?date=2025-11-14
      const data = await response.json();
      setRows(data);
      console.log(data);
    }
    loadAvailability();
  }, []);

  console.log(rows);
  return (
    <>
      {rows.length == 0 ? (
        <tr>No Sites Occupied</tr>
      ) : (
        rows.map((row) => (
          <tr key={row.siteid}>
            <td>{row.lastname}</td>
            <td>{row.siteid}</td>
            <td>{row.daysleft}</td>
            <td>{row.notes}</td>
          </tr>
        ))
      )}
    </>
  );
};

export default CurrentOccupied;
