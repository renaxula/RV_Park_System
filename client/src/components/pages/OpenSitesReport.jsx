export function OpenSitesReport() {
  return (
    <div>
      <h2>Open Sites Report</h2>
      <p>
        Shows which sites are available / reserved, nights available, hook-up,
        and rate per night for each date.
      </p>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Site</th>
            <th>Available Nights</th>
            <th>Hook-up</th>
            <th>Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2025-11-05</td>
            <td>Site 5</td>
            <td>3</td>
            <td>Full</td>
            <td>$45</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
