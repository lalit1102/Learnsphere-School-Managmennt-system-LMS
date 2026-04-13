const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { uploadMaterial, getMaterials } = require("../controllers/materialController");
const router = express.Router();

router.post("/", protect, authorize("teacher"), uploadMaterial);
router.get("/", protect, authorize("student", "teacher"), getMaterials);

module.exports = router;
