import { createBrowserRouter } from "react-router-dom";
import Home from "../Home";
import Login from "../Login";
import Register from "../Register";
import Dashboard from "../Dashboard";
import PrivateRoutes from "./PrivateRoutes";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard",
    element: <PrivateRoutes />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
    ],
  },
]);