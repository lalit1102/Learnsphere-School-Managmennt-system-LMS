import express from "express";
import {
  createClass,
  updateClass,
  deleteClass,
  getAllClasses,
} from "../controllers/classController.js";

import { authorize, protect } from "../middleware/authMiddleware.js";
const classRouter = express.Router();

// Create a new class (Admin only)
classRouter.post("/create", protect, authorize(["admin"]), createClass);

// Get all classes (Admin only)
classRouter.get("/", protect, authorize(["admin"]), getAllClasses);

// Update a class (Admin only)
classRouter.patch("/update/:id", protect, authorize(["admin"]), updateClass);

// Delete a class (Admin only)
classRouter.delete("/delete/:id", protect, authorize(["admin"]), deleteClass);

export default classRouter;