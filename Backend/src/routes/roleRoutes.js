
import express from "express";
import {
  getRoles,
  getRole,
  createRole,
  updateRole,
} from "../controllers/roleController.js";

const router = express.Router();

router.get("/", getRoles);
router.get("/:id", getRole);
router.post("/", createRole);
router.put("/:id", updateRole);

export default router;
