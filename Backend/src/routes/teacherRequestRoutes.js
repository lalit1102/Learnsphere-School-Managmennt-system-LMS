import express from "express";
import {
  requestTeacherApproval,
  getPendingTeacherRequests,
  reviewTeacherRequest,
} from "../controllers/teacherRequestController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Updated route to match frontend expectation
router.post("/teacher/request", requestTeacherApproval);
router.post("/submit", requestTeacherApproval); // Added route to match frontend
router.get("/admin/teacher-requests", protect, adminOnly, getPendingTeacherRequests);
router.patch("/admin/teacher-requests/:requestId", protect, adminOnly, reviewTeacherRequest);

export default router;
