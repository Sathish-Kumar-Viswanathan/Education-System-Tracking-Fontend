import { createBrowserRouter } from "react-router-dom";

import Login from "../pages/login/login";
import Registration from "../pages/registration/registration";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Registration />,
  },
]);
