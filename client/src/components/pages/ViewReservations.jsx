import { Card } from "../ui/Card";

export function ViewReservations() {
  return (
    <Card>
      <h2>View / Edit Reservations</h2>
      <p>List of current reservations with basic edit links.</p>
      <table>
        <thead>
          <tr>
            <th>Reservation ID</th>
            <th>Name</th>
            <th>Site</th>
            <th>Start</th>
            <th>End</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>123</td>
            <td>Jane Doe</td>
            <td>12</td>
            <td>2025-11-01</td>
            <td>2025-11-03</td>
            <td>
              <a href="#">Edit</a>
            </td>
          </tr>
        </tbody>
      </table>
    </Card>
  );
}
