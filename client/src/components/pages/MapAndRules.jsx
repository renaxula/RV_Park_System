import { Card } from "../ui/Card";

export function MapAndRules() {
  return (
    <Card>
      <h2>Map & Rules</h2>
      <p>
        Map placeholder (mobile-friendly). See current prices{" "}
        <a href="#/prices">here</a>.
      </p>
      <div style={{ border: "1px solid black", padding: "8px" }}>
        <p>[Map placeholder]</p>
        <p>Rules / FAQ:</p>
        <ul>
          <li>Check-in after 2pm.</li>
          <li>Maximum stay: 14 days.</li>
          <li>Reservations allowed up to 6 months in advance.</li>
        </ul>
      </div>
    </Card>
  );
}
