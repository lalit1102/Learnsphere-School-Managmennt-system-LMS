import express from "express";

import { protect, authorize } from "../middleware/authMiddleware.js";
import { getAllActivities } from "../controllers/activitieslogController.js";

const LogsRouter = express.Router();

// Get all activity logs (Admin & Teacher)
LogsRouter.get("/", protect, authorize(["admin", "teacher"]), getAllActivities);

export default LogsRouter;