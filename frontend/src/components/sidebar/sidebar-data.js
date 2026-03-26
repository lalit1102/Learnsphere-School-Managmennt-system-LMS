import {
  Settings2,
  School,
  GraduationCap,
  Users,
  LayoutDashboard,
  Banknote,
} from "lucide-react";

export const sidebardata = {
  teams: [
    {
      name: "LEARNSPHERE",
      logo: School,
    },
  ],
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "teacher", "student", "parent"],
      items: [
        { title: "Dashboard", url: "/dashboard", roles: ["admin", "teacher", "student", "parent"] },
        { title: "Activities Log", url: "/dashboard/activities-log", roles: ["admin"] },
      ],
    },
    {
      title: "Academics",
      url: "#",
      icon: School,
      roles: ["admin", "teacher", "student", "parent"],
      items: [
        { title: "Classes", url: "/dashboard/classes", roles: ["admin", "teacher"] },
        { title: "Subjects", url: "/dashboard/subjects", roles: ["admin", "teacher"] },
        { title: "Timetable", url: "/dashboard/timetable" },
        { title: "Attendance", url: "/dashboard/attendance" },
      ],
    },
    {
      title: "Learning (LMS)",
      url: "#",
      icon: GraduationCap,
      roles: ["teacher", "student", "admin"],
      items: [
        { title: "Assignments", url: "/dashboard/lms/assignments" },
        { title: "Exams", url: "/dashboard/lms/exams" },
        { title: "Study Materials", url: "/dashboard/lms/materials" },
      ],
    },
    {
      title: "People",
      url: "#",
      icon: Users,
      roles: ["admin", "teacher"],
      items: [
        { title: "Add User", url: "/dashboard/users/add", roles: ["admin", "teacher"] },
        { title: "Students", url: "/dashboard/users/students" },
        { title: "Teachers", url: "/dashboard/users/teachers", roles: ["admin"] },
        { title: "Parents", url: "/dashboard/users/parents", roles: ["admin"] },
        { title: "Admins", url: "/dashboard/users/admins", roles: ["admin"] },
      ],
    },
    {
      title: "Finance",
      url: "#",
      icon: Banknote,
      roles: ["admin"],
      items: [
        { title: "Fee Collection", url: "/dashboard/finance/fees" },
        { title: "Expenses", url: "/dashboard/finance/expenses" },
        { title: "Salary", url: "/dashboard/finance/salary" },
      ],
    },
    {
      title: "System",
      url: "#",
      icon: Settings2,
      roles: ["admin"],
      items: [
        { title: "School Settings", url: "/dashboard/settings/general" },
        { title: "Academic Years", url: "/dashboard/settings/academic-years" },
        { title: "Roles & Permissions", url: "/dashboard/settings/roles" },
      ],
    },
  ],
};
