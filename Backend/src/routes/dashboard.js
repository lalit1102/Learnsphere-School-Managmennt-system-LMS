import express from "express";
import { getDashboardStats } from "../controllers/dashboardController.js";
// import { generateDashboardInsight } from "../controllers/aiController.js";
import { protect } from "../middleware/authMiddleware.js";

const dashboardRouter = express.Router();

// Get Stats (Role is determined by token)
dashboardRouter.get("/stats", protect, getDashboardStats);

// Get AI Insight
// dashboardRouter.post("/insight", protect, generateDashboardInsight);

export default dashboardRouter;