import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import App from "../../App";
import { AdminDashboard } from "../pages/AdminDashboard";
import { AvailableSpots } from "../pages/AvailableSpots";
import { ChangePassword } from "../pages/ChangePassword";
import { ChangeRates } from "../pages/ChangeRates";
import { ElevateDemote } from "../pages/ElevateDemote";
import { EmployeeReservation } from "../pages/EmployeeReservation";
import { MakeReservation } from "../pages/MakeReservation";
import { EditReservation } from "../pages/EditReservation";
import { MapAndRules } from "../pages/MapAndRules";
import { OccupiedSitesReport } from "../pages/OccupiedSitesReport";
import { OpenSitesReport } from "../pages/OpenSitesReport";
import { Register } from "../pages/Register";
import { ResetPassword } from "../pages/ResetPassword";
import { ViewReservations } from "../pages/ViewReservations";
import styled from "styled-components";
import bg from "../../assets/background.png";
import { NavMenu } from "../ui/NavMenu";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { PageContent } from "./PageContent";


export default function AppRouter() {

  return (
    <AuthProvider>
      <BrowserRouter>
        <Content>
          <header>
            <NavMenu />
          </header>
          <Layout>
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
              <Route path="/edit-reservation" element={<EditReservation />} />
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
          </Layout>
        </Content>
        <PageContent/>
      </BrowserRouter>
    </AuthProvider>
  );
}

