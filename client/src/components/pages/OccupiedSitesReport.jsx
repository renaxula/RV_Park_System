import { useState } from "react";
import CurrentOccupied from "../reports/CurrentOccupied";
import { Card } from "../ui/Card";

export function OccupiedSitesReport() {
  const [dateSelect, setDateSelect] = useState("");

  const updateFilterHandler = (event) => {
    setDateSelect(document.getElementById("filter").value);
  };

  return (
    <Card>
      <h2>Occupied Sites Report</h2>
      <p>Shows date, last name, site, nights, and reservation notes.</p>
      <label htmlFor="filter">Select Date: </label>
      <input type="date" id="filter" onChange={updateFilterHandler} />
      <table>
        <thead>
          <tr>
            <th>Last Name</th>
            <th>Site</th>
            <th>Nights Left</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <CurrentOccupied filter={dateSelect} />
        </tbody>
      </table>
    </Card>
  );
}
//
