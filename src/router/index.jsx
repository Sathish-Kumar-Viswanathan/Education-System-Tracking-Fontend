import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/login/login";
import StudentDashboard from "../pages/studentDashboard/studentDashboard";
import StaffDashboard from "../pages/staffDashboard/staffDashboard";
import AdminDashboard from "../pages/adminDashboard/adminDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/studentDashboard",
    element: <StudentDashboard />,
  },
  {
    path: "/StaffDashboard",
    element: <StaffDashboard />,
  },
  {
    path: "/adminDashboard",
    element: <AdminDashboard />,
  },
]);
