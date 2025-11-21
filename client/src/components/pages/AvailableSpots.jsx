import { Card } from "../ui/Card";
import CurrentAvailability from "../reports/CurrentAvailability";

export function AvailableSpots() {
  return (
    <Card>
      <h2>Currently Available Spots</h2>
      <CurrentAvailability />
    </Card>
  );
}
