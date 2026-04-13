/**
 * ENHANCED CLASS ROUTES with Role-Based Access Control
 * =====================================================
 * 
 * Provides comprehensive class management with role-based filtering
 * 
 * Usage in server.js:
 * import classRoutesRBAC from './src/routes/classRoutesRBAC.js';
 * app.use('/api/classes', classRoutesRBAC);
 */

import express from "express";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  getClassStudents,
} from "../controllers/classControllerRBAC.js";

import { protect, authorize } from "../middleware/authMiddleware.js";

const classRouter = express.Router();

/**
 * ============================================
 * CLASS MANAGEMENT ROUTES (ADMIN ONLY)
 * ============================================
 */

/**
 * CREATE: Create a new class
 * @route POST /api/classes/create
 * @access Private - Admin only
 * @body {Object} { name, academicYear, classTeacher?, capacity?, subjects? }
 * @returns {Object} Created class
 * 
 * Example Request:
 * POST /api/classes/create
 * {
 *   "name": "Class 10-A",
 *   "academicYear": "2024-2025",
 *   "classTeacher": "teacher_id_here",
 *   "capacity": 40,
 *   "subjects": ["subject_id1", "subject_id2"]
 * }
 * 
 * Expected Response:
 * 201 Created
 * {
 *   "success": true,
 *   "message": "Class created successfully",
 *   "class": { ... }
 * }
 * 
 * Error: Teacher cannot create class
 * 403 Forbidden
 * {
 *   "success": false,
 *   "message": "Access denied. Your role 'teacher' is not authorized for this action."
 * }
 * 
 * Error: Student cannot create class
 * 403 Forbidden
 * {
 *   "success": false,
 *   "message": "Access denied. Your role 'student' is not authorized for this action."
 * }
 */
classRouter.post(
  "/create",
  protect,                          // Verify JWT
  authorize(["admin"]),             // Only admin - STRICTLY ENFORCED
  createClass
);

/**
 * READ: Get all classes (role-based filtering)
 * @route GET /api/classes
 * @access Private - Admin, Teacher, Student
 * @query {String} search - Search by name (optional)
 * @query {Number} page - Pagination (default: 1)
 * @query {Number} limit - Items per page (default: 10)
 * @returns {Array} Classes visible to user
 * 
 * Behavior by role:
 * - ADMIN:    See ALL classes
 * - TEACHER:  See ONLY classes they teach
 * - STUDENT:  See ONLY their assigned class
 * 
 * Example Requests:
 * // Admin gets all classes
 * GET /api/classes?page=1&limit=10
 * 
 * // Teacher gets assigned classes
 * GET /api/classes?search=10
 * 
 * // Student gets their class
 * GET /api/classes
 * 
 * Response:
 * 200 OK
 * {
 *   "success": true,
 *   "count": 2,
 *   "total": 2,
 *   "page": 1,
 *   "pages": 1,
 *   "userRole": "admin",
 *   "classes": [ ... ]
 * }
 */
classRouter.get(
  "/",
  protect,                                      // Verify JWT
  authorize(["admin", "teacher", "student"]),   // Everyone can see
  getAllClasses
);

/**
 * READ: Get single class by ID
 * @route GET /api/classes/:id
 * @access Private - Admin, Teacher (assigned), Student (own class)
 * @param {String} id - Class ID
 * @returns {Object} Class with details
 * 
 * Authorization:
 * - ADMIN:    Can view ANY class
 * - TEACHER:  Can view ONLY assigned classes
 * - STUDENT:  Can view ONLY their own class
 * 
 * Example Request:
 * GET /api/classes/605c72ef1a1234567890abcd
 * 
 * Success Response:
 * 200 OK
 * {
 *   "success": true,
 *   "class": { ... }
 * }
 * 
 * Error: Teacher viewing unassigned class
 * 403 Forbidden
 * {
 *   "success": false,
 *   "message": "You can only view your assigned classes"
 * }
 * 
 * Error: Student viewing wrong class
 * 403 Forbidden
 * {
 *   "success": false,
 *   "message": "You can only view your own class"
 * }
 */
classRouter.get(
  "/:id",
  protect,                                      // Verify JWT
  authorize(["admin", "teacher", "student"]),   // Everyone
  getClassById
);

/**
 * UPDATE: Update class details
 * @route PATCH /api/classes/:id
 * @access Private - Admin only
 * @param {String} id - Class ID
 * @body {Object} Fields to update
 * @returns {Object} Updated class
 * 
 * Only ADMIN can update:
 * - Class name
 * - Academic year
 * - Class capacity
 * - Subjects
 * - Assign/unassign teacher
 * 
 * Example Request:
 * PATCH /api/classes/605c72ef1a1234567890abcd
 * {
 *   "name": "Class 10-B",
 *   "capacity": 45,
 *   "classTeacher": "new_teacher_id"
 * }
 * 
 * Expected Response:
 * 200 OK
 * {
 *   "success": true,
 *   "message": "Class updated successfully",
 *   "class": { ... }
 * }
 * 
 * Error: Teacher cannot update
 * 403 Forbidden
 */
classRouter.patch(
  "/:id",
  protect,                    // Verify JWT
  authorize(["admin"]),       // Only admin
  updateClass
);

/**
 * DELETE: Delete a class
 * @route DELETE /api/classes/:id
 * @access Private - Admin only
 * @param {String} id - Class ID
 * @returns {Object} Success message
 * 
 * Only ADMIN can delete classes
 * 
 * Example Request:
 * DELETE /api/classes/605c72ef1a1234567890abcd
 * 
 * Expected Response:
 * 200 OK
 * {
 *   "success": true,
 *   "message": "Class deleted successfully"
 * }
 * 
 * Error: Teacher cannot delete
 * 403 Forbidden
 */
classRouter.delete(
  "/:id",
  protect,              // Verify JWT
  authorize(["admin"]),  // Only admin
  deleteClass
);

/**
 * ============================================
 * CLASS MEMBERSHIP MANAGEMENT
 * (ADMIN & TEACHER)
 * ============================================
 */

/**
 * ADD STUDENT TO CLASS
 * @route POST /api/classes/:id/students/add
 * @access Private - Admin, Teacher (own class)
 * @param {String} id - Class ID
 * @body {Object} { studentId }
 * @returns {Object} Updated class
 * 
 * Authorization:
 * - ADMIN:    Can add to ANY class
 * - TEACHER:  Can add to ONLY their own class
 * - STUDENT:  Cannot add students
 * 
 * Example Request:
 * POST /api/classes/605c72ef1a1234567890abcd/students/add
 * {
 *   "studentId": "605c72ef1a1234567890def1"
 * }
 * 
 * Expected Response:
 * 200 OK
 * { "success": true, "message": "Student added to class successfully" }
 * 
 * Error: Class at capacity
 * 400 Bad Request
 * { "success": false, "message": "Class is at full capacity (40)" }
 * 
 * Error: Teacher adding to other's class
 * 403 Forbidden
 * { "success": false, "message": "You can only add students to your own class" }
 */
classRouter.post(
  "/:id/students/add",
  protect,                          // Verify JWT
  authorize(["admin", "teacher"]),  // Admin or Teacher only
  addStudentToClass
);

/**
 * REMOVE STUDENT FROM CLASS
 * @route DELETE /api/classes/:id/students/:studentId
 * @access Private - Admin, Teacher (own class)
 * @param {String} id - Class ID
 * @param {String} studentId - Student's user ID
 * @returns {Object} Updated class
 * 
 * Authorization:
 * - ADMIN:    Can remove from ANY class
 * - TEACHER:  Can remove from ONLY their own class
 * 
 * Example Request:
 * DELETE /api/classes/605c72ef1a1234567890abcd/students/605c72ef1a1234567890def1
 * 
 * Expected Response:
 * 200 OK
 * { "success": true, "message": "Student removed from class successfully" }
 */
classRouter.delete(
  "/:id/students/:studentId",
  protect,                          // Verify JWT
  authorize(["admin", "teacher"]),  // Admin or Teacher only
  removeStudentFromClass
);

/**
 * GET CLASS STUDENTS
 * @route GET /api/classes/:id/students
 * @access Private - Admin, Teacher (own), Student (same class)
 * @param {String} id - Class ID
 * @returns {Array} Students in class
 * 
 * Authorization:
 * - ADMIN:    Can view ANY class's students
 * - TEACHER:  Can view ONLY their class's students
 * - STUDENT:  Can view ONLY if they're in the class
 * 
 * Example Request:
 * GET /api/classes/605c72ef1a1234567890abcd/students
 * 
 * Expected Response:
 * 200 OK
 * {
 *   "success": true,
 *   "count": 35,
 *   "students": [ ... ]
 * }
 */
classRouter.get(
  "/:id/students",
  protect,                                      // Verify JWT
  authorize(["admin", "teacher", "student"]),   // Everyone
  getClassStudents
);

export default classRouter;
