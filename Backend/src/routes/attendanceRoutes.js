import express from "express";
import {
  markAttendance,
  getAttendance,
  getStudentAttendance,
} from "../controllers/attendanceController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// @route   POST /api/attendance/mark
// @desc    Mark student attendance
// @access  Private (Admin, Teacher)
router.post("/mark", protect, authorize(["admin", "teacher"]), markAttendance);

// @route   GET /api/attendance
// @desc    Get attendance for a class and date
// @access  Private
router.get("/", protect, getAttendance);

// @route   GET /api/attendance/student/:id
// @desc    Get attendance history for a student
// @access  Private
router.get("/student/:id", protect, getStudentAttendance);

export default router;
