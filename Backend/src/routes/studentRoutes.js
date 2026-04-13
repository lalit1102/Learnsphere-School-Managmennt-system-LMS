/**
 * EXAMPLE: Student Routes with Role-Based Access Control
 * Students have LIMITED access - only to their own data
 * 
 * Define these routes in your server.js:
 * import studentRoutes from './src/routes/studentRoutes.js';
 * app.use('/api/students', studentRoutes);
 */

import express from "express";
import {
  protect,
  authorize,
  adminOnly,
  checkOwnership,
  checkPermission,
} from "../middleware/authMiddleware.js";

const studentRoutes = express.Router();

/**
 * ============================================
 * STUDENT MANAGEMENT (ADMIN ONLY)
 * ============================================
 */

/**
 * CREATE: Register a new student
 * Only ADMIN can create students
 * @route POST /api/students/create
 * @access Private - Admin only
 * @body {Object} student: { name, email, password, class }
 * @returns {Object} Created student object
 */
studentRoutes.post(
  "/create",
  protect,
  authorize(["admin"]), // ONLY ADMIN
  (req, res) => {
    // Controller: createStudent
    res.status(201).json({ message: "Student created" });
  }
);

/**
 * READ: Get all students (ADMIN ONLY)
 * Admin can see all students
 * Teachers can see students in their classes (separate route)
 * @route GET /api/students
 * @access Private - Admin only
 * @returns {Array} List of all students
 */
studentRoutes.get(
  "/",
  protect,
  authorize(["admin"]), // ONLY ADMIN
  (req, res) => {
    // Controller: getAllStudents
    res.json({ students: [] });
  }
);

/**
 * READ: Get single student by ID
 * ADMIN can see any student
 * STUDENT can only see their own profile
 * @route GET /api/students/:id
 * @access Private - Admin or Student (self)
 * @returns {Object} Student object
 */
studentRoutes.get(
  "/:id",
  protect,
  authorize(["admin", "student"]),
  checkOwnership, // Ensure student is viewing their own data
  (req, res) => {
    // Controller: getStudentById
    res.json({ message: "Student profile" });
  }
);

/**
 * UPDATE: Update student details
 * ONLY ADMIN can update students
 * Students CANNOT update their own profile (security measure)
 * @route PATCH /api/students/:id
 * @access Private - Admin only
 * @body {Object} updated fields
 */
studentRoutes.patch(
  "/:id",
  protect,
  authorize(["admin"]), // ONLY ADMIN
  (req, res) => {
    // Controller: updateStudent
    res.json({ message: "Student updated" });
  }
);

/**
 * DELETE: Remove a student
 * ONLY ADMIN can delete students
 * @route DELETE /api/students/:id
 * @access Private - Admin only
 */
studentRoutes.delete(
  "/:id",
  protect,
  authorize(["admin"]), // ONLY ADMIN
  (req, res) => {
    // Controller: deleteStudent
    res.json({ message: "Student deleted" });
  }
);

/**
 * ============================================
 * STUDENT-SPECIFIC DATA ACCESS
 * Students can only view their own data
 * ============================================
 */

/**
 * GET: Student's attendance
 * Student can view their own attendance
 * Admin can view any student's attendance
 * @route GET /api/students/:id/attendance
 * @access Private - Admin, Student (self)
 * @returns {Array} Attendance records
 */
studentRoutes.get(
  "/:id/attendance",
  protect,
  authorize(["admin", "student"]),
  checkOwnership, // Students can only view their own
  checkPermission("viewOwnAttendance"),
  (req, res) => {
    // Controller: getStudentAttendance
    res.json({ attendance: [] });
  }
);

/**
 * GET: Student's assignments
 * Student can view their own assignments
 * Admin & Teachers can view
 * @route GET /api/students/:id/assignments
 * @access Private - Admin, Teacher, Student (self)
 * @returns {Array} Assignment list
 */
studentRoutes.get(
  "/:id/assignments",
  protect,
  authorize(["admin", "teacher", "student"]),
  checkPermission("viewOwnAssignments"),
  (req, res) => {
    // Controller: getStudentAssignments
    res.json({ assignments: [] });
  }
);

/**
 * GET: Student's exams/grades
 * Student can view their own exam results
 * @route GET /api/students/:id/exams
 * @access Private - Admin, Teacher, Student (self)
 * @returns {Array} Exam results
 */
studentRoutes.get(
  "/:id/exams",
  protect,
  authorize(["admin", "teacher", "student"]),
  checkPermission("viewOwnExams"),
  (req, res) => {
    // Controller: getStudentExams
    res.json({ exams: [] });
  }
);

/**
 * GET: Student's timetable
 * Student can view their own timetable
 * @route GET /api/students/:id/timetable
 * @access Private - Admin, Teacher, Student (self)
 * @returns {Array} Timetable
 */
studentRoutes.get(
  "/:id/timetable",
  protect,
  authorize(["admin", "teacher", "student"]),
  checkPermission("viewOwnTimetable"),
  (req, res) => {
    // Controller: getStudentTimetable
    res.json({ timetable: [] });
  }
);

/**
 * POST: Student submits assignment
 * Only the student can submit their own assignment
 * @route POST /api/students/:id/assignments/:assignmentId/submit
 * @access Private - Student (self)
 * @body {Object} submission details
 */
studentRoutes.post(
  "/:id/assignments/:assignmentId/submit",
  protect,
  authorize(["student"]), // ONLY STUDENT
  checkOwnership, // Can only submit for themselves
  (req, res) => {
    // Controller: submitAssignment
    res.json({ message: "Assignment submitted" });
  }
);

export default studentRoutes;
