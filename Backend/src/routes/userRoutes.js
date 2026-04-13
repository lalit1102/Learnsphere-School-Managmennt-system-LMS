import express from "express";

const userRoutes = express.Router();


import { protect, authorize } from "../middleware/authMiddleware.js";
import { deleteUser, getUserProfile, getUsers, login, logoutUser, register, updateUser } from "../controllers/userController.js";
import { getUserRolesAndPermissions } from "../controllers/teacherRequestController.js";


userRoutes.post(
  "/register",
  protect,
  authorize(["admin", "teacher"]),
  register
);






userRoutes.post("/login", login);
userRoutes.post("/logout", logoutUser);
userRoutes.get("/profile", protect, getUserProfile);
userRoutes.get("/:userId/roles", protect, getUserRolesAndPermissions);
userRoutes.get("/", protect, authorize(["admin", "teacher"]), getUsers);
userRoutes.put(
  "/update/:id",
  protect,
  authorize(["admin", "teacher"]),
  updateUser
);
userRoutes.delete(
  "/delete/:id",
  protect,
  authorize(["admin", "teacher"]),
  deleteUser
);

export default userRoutes;
