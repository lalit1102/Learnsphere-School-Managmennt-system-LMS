import express from "express";
import { generateTimetable, generateTimetableDirect, getTimetable } from "../controllers/timetableController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const timetableRouter = express.Router();

// Generate via Inngest (async - requires Inngest dev server)
timetableRouter.post("/generate", protect, authorize(["admin", "teacher"]), generateTimetable);

// Generate directly (synchronous - no Inngest needed)
timetableRouter.post("/generate-direct", protect, authorize(["admin", "teacher"]), generateTimetableDirect);

// View: Everyone (Students need to see their schedule)
timetableRouter.get("/:classId", protect, getTimetable);

export default timetableRouter;