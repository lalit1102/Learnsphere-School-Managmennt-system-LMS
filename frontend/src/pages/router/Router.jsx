import { createBrowserRouter } from "react-router-dom";
import Home from "../Home";
import Login from "../Login";
import Register from "../Register";
import Dashboard from "../Dashboard";
import AddUser from "../admin/AddUser";
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
      {
        path: "users/add",
        element: <AddUser />,
      },
      { path: "activities-log", element: <div>Activities Log</div> },
      { path: "classes", element: <div>Classes</div> },
      { path: "subjects", element: <div>Subjects</div> },
      { path: "timetable", element: <div>Timetable</div> },
      { path: "attendance", element: <div>Attendance</div> },
      { path: "lms/assignments", element: <div>Assignments</div> },
      { path: "lms/exams", element: <div>Exams</div> },
      { path: "lms/materials", element: <div>Study Materials</div> },
      { path: "users/students", element: <div>Students</div> },
      { path: "users/teachers", element: <div>Teachers</div> },
      { path: "users/parents", element: <div>Parents</div> },
      { path: "users/admins", element: <div>Admins</div> },
      { path: "finance/fees", element: <div>Fee Collection</div> },
      { path: "finance/expenses", element: <div>Expenses</div> },
      { path: "finance/salary", element: <div>Salary</div> },
      { path: "settings/general", element: <div>General Settings</div> },
      { path: "settings/academic-years", element: <div>Academic Years</div> },
      { path: "settings/roles", element: <div>Roles & Permissions</div> },
    ],
  },
]);