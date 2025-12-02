import App from "../../App";
import { AdminDash } from "../pages/AdminDash";
import { AvailableSpots } from "../pages/AvailableSpots";
import { ChangePassword } from "../pages/ChangePassword";
import { ChangeRates } from "../pages/ChangeRates";
import { CustomerDash } from "../pages/CustomerDash";
import { EditReservation } from "../pages/EditReservation";
import { ElevateDemote } from "../pages/ElevateDemote";
import { EmployeeReservation } from "../pages/EmployeeReservation";
import { Login } from "../pages/Login";
import { MakeReservation } from "../pages/MakeReservation";
import { MapAndRules } from "../pages/MapAndRules";
import { OccupiedSitesReport } from "../pages/OccupiedSitesReport";
import { OpenSitesReport } from "../pages/OpenSitesReport";
import { Register } from "../pages/Register";
import { ResetPassword } from "../pages/ResetPassword";
import { ViewReservations } from "../pages/ViewReservations";
import { EmployeeDash } from "../pages/EmployeeDash";

export const routesConfig = [
  {
    path: "/",
    label: "Home",
    requiredRole: "customer",
    Component: App,
    showInNav: true,
  },
  {
    path: "/login",
    label: "Login",
    requiredRole: null,
    Component: Login,
    showInNav: false,
  },
  {
    path: "/make-reservation",
    label: "Make Reservation",
    requiredRole: "customer",
    Component: MakeReservation,
    showInNav: true,
  },
  {
    path: "/view-reservations",
    label: "View Reservations",
    requiredRole: "customer",
    Component: ViewReservations,
    showInNav: true,
  },
  {
    path: "/edit-reservation",
    label: "Edit Reservation",
    requiredRole: "customer",
    Component: EditReservation,
    showInNav: false,
  },
  {
    path: "/available-spots",
    label: "Available Spots",
    requiredRole: "customer",
    Component: AvailableSpots,
    showInNav: true,
  },
  {
    path: "/open-report",
    label: "Open Sites Report",
    requiredRole: "customer",
    Component: OpenSitesReport,
    showInNav: true,
  },
  {
    path: "/map-and-rules",
    label: "Map & Rules",
    requiredRole: "customer",
    Component: MapAndRules,
    showInNav: true,
  },
  {
    path: "/register",
    label: "Register",
    requiredRole: null,
    Component: Register,
    showInNav: true,
  },
  {
    path: "/reset-password",
    label: "Reset Password",
    requiredRole: "admin",
    Component: ResetPassword,
    showInNav: true,
  },
  {
    path: "/change-password",
    label: "Change Password",
    requiredRole: "customer",
    Component: ChangePassword,
    showInNav: true,
  },
  {
    path: "/employee-reservation",
    label: "Employee Reservation",
    requiredRole: "employee",
    Component: EmployeeReservation,
    showInNav: true,
  },
  {
    path: "/occupied-report",
    label: "Occupied Sites Report",
    requiredRole: "employee",
    Component: OccupiedSitesReport,
    showInNav: true,
  },
  {
    path: "/elevate-demote",
    label: "Elevate/Demote",
    requiredRole: "admin",
    Component: ElevateDemote,
    showInNav: true,
  },
  {
    path: "/change-rates",
    label: "Change Rates",
    requiredRole: "admin",
    Component: ChangeRates,
    showInNav: true,
  },
  {
    path: "/customer-dash",
    label: "Home",
    requiredRole: "customer",
    Component: CustomerDash,
    // showInNav: true,
  },{
    path: "/employee-dash",
    label: "Home",
    requiredRole: "employee",
    Component: EmployeeDash,
    // showInNav: true,
  },
  {
    path: "/admin-dash",
    label: "Home",
    requiredRole: "admin",
    Component: AdminDash,
    // showInNav: true,
  },
];
