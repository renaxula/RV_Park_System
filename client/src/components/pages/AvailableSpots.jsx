import { Card } from "../ui/Card";
import CurrentAvailability from "../reports/CurrentAvailability";

export function AvailableSpots() {
  return (
    <Card>
      <CurrentAvailability />
    </Card>
  );
}
