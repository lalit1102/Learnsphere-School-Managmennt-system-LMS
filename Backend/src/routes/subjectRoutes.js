import express from "express";
import {
  createSubject,
  getAllSubjects,
  updateSubject,
  deleteSubject,
} from "../controllers/subjectController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const subjectRouter = express.Router();

subjectRouter.route("/")
  .get(protect, getAllSubjects)
  .post(protect, authorize(["admin"]), createSubject);

subjectRouter.route("/:id")
  .put(protect, authorize(["admin"]), updateSubject)
  .delete(protect, authorize(["admin"]), deleteSubject);

export default subjectRouter;