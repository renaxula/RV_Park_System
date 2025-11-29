import CurrentAvailability from "../reports/CurrentAvailability";
import { Card } from "../ui/Card";

export function OpenSitesReport() {
  return (
    <Card>
      <h2>Open Sites Report</h2>
      <p>
        Shows which sites are available, nights available, and rate per night
        for each date.
      </p>
      <CurrentAvailability />
    </Card>
  );
}
