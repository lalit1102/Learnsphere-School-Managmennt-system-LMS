const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { createAssignment, submitAssignment, gradeAssignment } = require("../controllers/assignmentController");
const router = express.Router();

router.post("/", protect, authorize("teacher"), createAssignment);
router.post("/:id/submit", protect, authorize("student"), submitAssignment);
router.post("/:id/grade", protect, authorize("teacher"), gradeAssignment);

module.exports = router;
