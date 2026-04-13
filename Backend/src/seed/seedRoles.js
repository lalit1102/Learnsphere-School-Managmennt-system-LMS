import mongoose from "mongoose";
import Role from "../models/role.js";
import { PERMISSIONS } from "../constants/permissions.js";
import dotenv from "dotenv";
dotenv.config();

const roles = [
  {
    name: "admin",
    permissions: ["*"],
  },
  {
    name: "teacher",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.ADD_CLASS,
      PERMISSIONS.EDIT_CLASS,
      PERMISSIONS.VIEW_STUDENTS,
      PERMISSIONS.VIEW_TEACHERS,
      PERMISSIONS.VIEW_SETTINGS,
    ],
  },
  {
    name: "student",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_CLASSES,
      PERMISSIONS.VIEW_STUDENTS,
    ],
  },
  {
    name: "parent",
    permissions: [
      PERMISSIONS.VIEW_DASHBOARD,
      PERMISSIONS.VIEW_STUDENTS,
    ],
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URL);
  await Role.deleteMany();
  await Role.insertMany(roles);
  console.log("Roles seeded");
  process.exit();
};

seed();
