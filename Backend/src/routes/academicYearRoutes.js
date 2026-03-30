import express from "express";
import {
  createAcademicYear,
  getCurrentAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getAllAcademicYears,
} from "../controllers/academicYear.js";

import { authorize, protect } from "../middleware/authMiddleware.js";

const academicYearRouter = express.Router();

// Get all academic years (Admin only)
academicYearRouter
  .route("/")
  .get(protect, authorize(["admin"]), getAllAcademicYears);

// Create a new academic year (Admin only)
academicYearRouter
  .route("/create")
  .post(protect, authorize(["admin"]), createAcademicYear);

// Get the current active academic year
academicYearRouter.route("/current").get(protect, getCurrentAcademicYear);

// Update an academic year (Admin only)
academicYearRouter
  .route("/update/:id")
  .patch(protect, authorize(["admin"]), updateAcademicYear);

// Delete an academic year (Admin only)
academicYearRouter
  .route("/delete/:id")
  .delete(protect, authorize(["admin"]), deleteAcademicYear);

export default academicYearRouter;