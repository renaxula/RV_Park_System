import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "../../App";
import { AdminDashboard } from "../pages/AdminDashboard";
import { AvailableSpots } from "../pages/AvailableSpots";
import { ChangePassword } from "../pages/ChangePassword";
import { ChangeRates } from "../pages/ChangeRates";
import { ElevateDemote } from "../pages/ElevateDemote";
import { EmployeeReservation } from "../pages/EmployeeReservation";
import { MakeReservation } from "../pages/MakeReservation";
import { MapAndRules } from "../pages/MapAndRules";
import { OccupiedSitesReport } from "../pages/OccupiedSitesReport";
import { OpenSitesReport } from "../pages/OpenSitesReport";
import { Register } from "../pages/Register";
import { ResetPassword } from "../pages/ResetPassword";
import { ViewReservations } from "../pages/ViewReservations";
import styled from "styled-components";
import bg from "../../assets/background.png";
import { NavMenu } from "../ui/NavMenu";

export default function AppRouter() {
  return (
    <Page>
      <BrowserRouter>
        <Content>
          <header>
            <NavMenu />
          </header>
          <main>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/available-spots" element={<AvailableSpots />} />
              <Route path="/change-rates" element={<ChangeRates />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="/elevate-demote" element={<ElevateDemote />} />
              <Route
                path="/employee-reservation"
                element={<EmployeeReservation />}
              />
              <Route path="/make-reservation" element={<MakeReservation />} />
              <Route path="/map-and-rules" element={<MapAndRules />} />
              <Route
                path="/occupied-report"
                element={<OccupiedSitesReport />}
              />
              <Route path="/open-report" element={<OpenSitesReport />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/view-reservations" element={<ViewReservations />} />
            </Routes>
          </main>
        </Content>
      </BrowserRouter>
    </Page>
  );
}

const Page = styled.div`
  position: relative;
  width: 100%;
  min-height: 100vh;
  margin: 0;
  background-image: url(${bg});
  background-size: cover;
  background-position: right;
  padding: 0; /* background touches edges */
  color: #fff;
  > * {
    position: relative;
    z-index: 1;
  }
  form {
    background: rgba(255, 255, 255, 1);
    color: #000;
    padding: 12px;
    border-radius: 6px;
    max-width: 720px;
    filter: drop-shadow(0 0 10px rgba(0, 0, 0, 0.5));
    margin-top: 12px;
  }
`;

const Content = styled.div`
  padding: 24px;
`;
