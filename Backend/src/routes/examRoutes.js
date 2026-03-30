import express from "express";
import {
  triggerExamGeneration,
  getExams,
  submitExam,
  getExamById,
  toggleExamStatus,
  getExamResult,
} from "../controllers/examController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const examRouter = express.Router();

// Trigger AI exam generation (Teacher/Admin)
examRouter.post(
  "/generate",
  protect,
  authorize(["teacher", "admin"]),
  triggerExamGeneration
);

// Get exams (role-based)
examRouter.get(
  "/",
  protect,
  authorize(["teacher", "student", "admin"]),
  getExams
);

// Student submits exam
examRouter.post(
  "/:id/submit",
  protect,
  authorize(["student", "admin"]),
  submitExam
);

// Teacher/Admin toggles exam status
examRouter.patch(
  "/:id/status",
  protect,
  authorize(["teacher", "admin"]),
  toggleExamStatus
);

// Get exam results
examRouter.get(
  "/:id/result",
  protect,
  authorize(["student", "admin", "teacher"]),
  getExamResult
);

// Get exam by ID
examRouter.get(
  "/:id",
  protect,
  authorize(["teacher", "student", "admin"]),
  getExamById
);

export default examRouter;