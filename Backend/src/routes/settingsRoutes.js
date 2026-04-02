import express from "express";

const settingsRoutes = express.Router();

import { protect, authorize } from "../middleware/authMiddleware.js";
import { getSettings, updateSettings } from "../controllers/settingsController.js";

// @route   GET /api/settings
// @access  Private (Admin)
settingsRoutes.get("/", protect, authorize(["admin"]), getSettings);

// @route   PUT /api/settings
// @access  Private (Admin)
settingsRoutes.put("/", protect, authorize(["admin"]), updateSettings);

export default settingsRoutes;
