import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/login/login";
import Registration from "../pages/registration/registration";
import StudentDashboard from "../pages/studentDashboard/studentDashboard";
import StaffDashboard from "../pages/staffDashboard/staffDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Registration />,
  },
  {
    path: "/studentDashboard",
    element: <StudentDashboard />,
  },
  {
    path: "/StaffDashboard",
    element: <StaffDashboard />,
  },
]);
