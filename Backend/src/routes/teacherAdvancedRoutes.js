/**
 * EXAMPLE: Advanced Teaching Routes with Role-Based Access Control
 * This file demonstrates implementing protected routes for teacher-specific operations
 * 
 * Define these routes in your server.js:
 * import teacherRoutes from './src/routes/teacherRoutes.js';
 * app.use('/api/teachers', teacherRoutes);
 */

import express from "express";
import {
  protect,
  authorize,
  adminOnly,
  teacherOrAdmin,
  checkPermission,
  checkTeacherOwnership,
} from "../middleware/authMiddleware.js";
import {
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeachers,
  getTeacherById,
  getTeacherClasses,
  getTeacherStudents,
} from "../controllers/userController.js";

const teacherRoutes = express.Router();

/**
 * ============================================
 * TEACHER MANAGEMENT (ADMIN ONLY)
 * ============================================
 */

/**
 * CREATE: Add a new teacher
 * Only ADMIN can create teachers
 * @route POST /api/teachers/create
 * @access Private - Admin only
 * @returns {Object} Created teacher object
 */
teacherRoutes.post(
  "/create",
  protect,
  authorize(["admin"]), // ONLY ADMIN
  createTeacher
);

/**
 * READ: Get all teachers
 * Admin can see all, Teachers can see their colleagues
 * @route GET /api/teachers
 * @access Private - Admin, Teacher
 * @returns {Array} List of teachers
 */
teacherRoutes.get(
  "/",
  protect,
  authorize(["admin", "teacher"]), // ADMIN or TEACHER
  getTeachers
);

/**
 * READ: Get single teacher by ID
 * Only ADMIN and the TEACHER themselves
 * @route GET /api/teachers/:id
 * @access Private - Admin or Teacher (ownership)
 * @returns {Object} Teacher object
 */
teacherRoutes.get(
  "/:id",
  protect,
  authorize(["admin", "teacher"]),
  getTeacherById
);

/**
 * UPDATE: Update teacher details
 * Only ADMIN can update any teacher
 * Teachers can update their own profile
 * @route PATCH /api/teachers/:id
 * @access Private - Admin only (or self)
 */
teacherRoutes.patch(
  "/:id",
  protect,
  authorize(["admin"]), // ONLY ADMIN - for security
  updateTeacher
);

/**
 * DELETE: Remove a teacher
 * Only ADMIN can delete teachers
 * @route DELETE /api/teachers/:id
 * @access Private - Admin only
 */
teacherRoutes.delete(
  "/:id",
  protect,
  authorize(["admin"]), // ONLY ADMIN
  deleteTeacher
);

/**
 * ============================================
 * TEACHER-SPECIFIC OPERATIONS
 * ============================================
 */

/**
 * GET: Teacher's assigned classes
 * Only the teacher can view their own classes
 * Admin can view any teacher's classes
 * @route GET /api/teachers/:id/classes
 * @access Private - Admin, Teacher (self only)
 * @returns {Array} Classes assigned to teacher
 */
teacherRoutes.get(
  "/:id/classes",
  protect,
  authorize(["admin", "teacher"]),
  getTeacherClasses
);

/**
 * GET: Students in teacher's classes
 * Only teacher of that class + admin
 * @route GET /api/teachers/:id/students
 * @access Private - Admin, Teacher (assigned only)
 * @returns {Array} Students in teacher's classes
 */
teacherRoutes.get(
  "/:id/students",
  protect,
  authorize(["admin", "teacher"]),
  getTeacherStudents
);

/**
 * POST: Take attendance for class
 * Only assigned teacher + admin
 * @route POST /api/teachers/:id/attendance
 * @access Private - Admin, Teacher (assigned)
 * @body {Array} attendance records
 */
teacherRoutes.post(
  "/:id/attendance",
  protect,
  authorize(["admin", "teacher"]),
  checkPermission("takeAttendance"),
  (req, res) => {
    // Controller: handle attendance logic
    res.json({ message: "Attendance recorded" });
  }
);

/**
 * POST: Create assignment/exam
 * Only assigned teacher + admin
 * @route POST /api/teachers/:id/create-exam
 * @access Private - Admin, Teacher
 * @body {Object} exam details
 */
teacherRoutes.post(
  "/:id/create-exam",
  protect,
  authorize(["admin", "teacher"]),
  checkPermission("createExam"),
  (req, res) => {
    // Controller: handle exam creation
    res.json({ message: "Exam created" });
  }
);

export default teacherRoutes;
