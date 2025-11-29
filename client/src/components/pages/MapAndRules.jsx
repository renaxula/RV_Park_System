import { Card } from "../ui/Card";
import map from "../../assets/famcamp-map-01.png";
import styled from "styled-components";

export function MapAndRules() {
  return (
    <Card>
      <h2>Map & Rules</h2>
      <Layout>
        <Rules>
          <RuleSection>
            <h2>Info</h2>
            <p>
              <b>Address:</b> 5622 Park Ln Bldg. #564 Hill AFB, UT 84056
            </p>
            <p>
              <b>Phone:</b> (801) 775-3250
            </p>
            <p>
              <b>Office Hours:</b> Monday - Friday, 0800 - 1600
            </p>
            <p>
              <b>Postal Service Mailing Address:</b> Your Name FamCamp 7338
              Loncki St. Hill AFB, UT 84056{" "}
              <i>
                Postal service mail needs to be picked up at the Base Post
                Office Bldg 344
              </i>
            </p>
            <p>
              <b>UPS & Fed Ex:</b> Your Name FamCamp Bldg 564 Site # 5622 Park
              Lande Hill AFB, UT 84056
            </p>
            <p>
              <b>Website:</b> www.75fss.com
            </p>
            <br />
            <h2>General</h2>
            <p>
              <b>Check-In:</b> is after 1300
            </p>
            <p>
              <b>Check-Out:</b> is by 1200
            </p>
            <p>
              <b>Quite Hours</b> are 2200 - 0800{" "}
              <i>Generator use is not permitted during quite hours.</i>
            </p>
            <br />
            <p>
              <b>Rec Room:</b> Features include microwave, dining area, TV
              lounge, study room, and book exchange. WiFi is available in or
              near the building. Stop by the office to check out our free DVD
              rentals
            </p>
            <p>
              <b>Laundry:</b> Machines cost $1 per cycle and a coin machine is
              available in the Laundry room. Please do not launder pet bedding
              or heavily soiled items in these machines.
            </p>
            <p>
              <b>Ice:</b> Available in the laundry room free of charge. Please
              refrain from filling large ice chests.
            </p>
          </RuleSection>
          <RuleSection>
            <h2>Payments</h2>
            <p>
              Payments can be made with Visa/MasterCard or cash in the office
              during regular hours. After-Hours arrivals must pay cash only and
              use the check-in booth located next to the office.Personal checks
              are not accepted.
            </p>
            <br />
            <h2>Reservations</h2>
            <p>
              Reservations can be made up to 6 months in advance and must be
              paid in full at time of reservation.
            </p>
            <p>
              Cancellations made at least 3 days before arrival will be charged
              a $10 fee. Cancellations made less than 3 days prior will be
              charged a 1 dav fee. Cancellations for holidays or special events
              will be charged a 1 day fee.
            </p>
            <p>
              Maximum length of stay April-October is 14 consecutive days except
              for those traveling on PCS orders. Long term stays are allowed
              October 15th to April 1st. For detailed information, please
              contact the FamCamp
            </p>
            <br />

            <h2>Guidelines</h2>

            <p>
              In an effort to ensure compliance with all public health and
              safety requirements, RVs are subject to inspection when conditions
              observed from the exterior of the RV suggest a potential hazard or
              substandard condition exists within the unit. In the event of an
              inspection, all RV units must be able to demonstrate the
              following:
            </p>
            <ul>
              <li>
                Proper connection to the park's fresh water system using the
                unit's exterior water connection. The fresh water connector on
                the unit should be inspected to ensure it is leak-free and made
                of a material approved for potable water.
              </li>
              <li>
                Power cord and/or approved adapter is approved for RV use and
                maintained in a safe operating condition.
              </li>
              <li>
                The sewer drain connection on the unit must be gas tight and
                leak-free. Hose must be constructed of minimum schedule 40 ABS
                plastic approved for drain and waste
              </li>
            </ul>
          </RuleSection>
          <div>
            <h2>Pets</h2>

            <p>
              Leashed and vaccinated pets are welcome provided pet owners adhere
              to the following installation requirements:
            </p>
            <ul>
              <li>
                Animal waste will be picked up and properly disposed of
                immediately.
              </li>
              <li>
                Pets will remain on a leash in control of the owner unless in
                the designated dog park area.
              </li>
              <li>
                When using the dog park, the pet owner must be present at all
                times.
              </li>
              <li>Dogs will not be chained outdoors or left</li>
              <li>
                In consideration of other guests, nuisance pet behavior will not
                be permitted. This is to include but not be limited to pets that
                display aggression and/or excessive barking.
              </li>
              <li>2 pet maximum.</li>
              <li>
                Dogs with any of the following breed lineage are restricted from
                FamCamp: Pit bulls, Staffordshire Terriers, Rottweilers, Chow
                Chows, Doberman Pinschers, wolf hybrids
              </li>
            </ul>
            <br />
            <h2>Parking</h2>
            <p>
              Vehicles are only allowed to park in assigned spaces. Parking on
              vacant sites or roadways is not authorized. Please see Camp Host
              or Staff for information on overflow parking and visitor areas.
              Parking on grass is not permitted.
            </p>
          </div>
        </Rules>
        <br />
        <hr />
        <br />
        <Map src={map} alt={"Map of the rv park"}></Map>
      </Layout>
    </Card>
  );
}

const Map = styled.img`
  max-width: 80%;
  height: auto;
  padding 1rem;
  aspect-ratio: 1916 / 1449;
  object-fit: cover;
  margin: auto;
`;

const Layout = styled.div`
  display: flex;
  flex-direction: column;
`;

const Rules = styled.div`
  padding: 1rem;
  display: flex;
  grid-template-columns: auto auto auto;
  ul {
    width: 70%;
    margin: auto;
  }
  gap: 1rem;
`;

const RuleSection = styled.div`
  border-right: 2px solid black;
  padding-right: 1.5rem;
`;
