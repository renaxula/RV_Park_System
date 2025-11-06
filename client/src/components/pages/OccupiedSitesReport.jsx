export function OccupiedSitesReport() {
  return (
    <div>
      <h2>Occupied Sites Report</h2>
      <p>Shows date, last name, site, nights, and reservation notes.</p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Last Name</th>
            <th>Site</th>
            <th>Nights</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2025-11-01</td>
            <td>Smith</td>
            <td>12</td>
            <td>2</td>
            <td>Arriving late</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
