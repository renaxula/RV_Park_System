import CurrentOccupied from "../reports/CurrentOccupied";
import { Card } from "../ui/Card";

export function OccupiedSitesReport() {
  return (
    <Card>
      <h2>Occupied Sites Report</h2>
      <p>Shows date, last name, site, nights, and reservation notes.</p>
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
          <CurrentOccupied />
        </tbody>
      </table>
    </Card>
  );
}
//
