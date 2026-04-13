/**
 * EXAMPLE CONTROLLER: Proper Authorization Implementation
 * ========================================================
 * 
 * This file demonstrates how to implement role-based checks
 * in your controller functions with proper error handling
 * 
 * Integration pattern:
 * 1. Route defines which roles can call this function (via authorize middleware)
 * 2. Controller receives authenticated user in req.user
 * 3. Controller performs additional checks if needed
 * 4. Controller returns appropriate status codes
 */

import User from "../models/user.js";
import Class from "../models/class.js";
import { logActivity } from "../utils/activitieslog.js";
import { ROLE_PERMISSIONS } from "../constants/roles.js";

/**
 * ============================================
 * EXAMPLE 1: Create Teacher (Admin Only)
 * ============================================
 * 
 * Route Protection: @route POST /api/teachers/create
 * - Required middleware: protect, authorize(['admin'])
 * 
 * What this function does:
 * 1. Validates input
 * 2. Checks if teacher already exists
 * 3. Creates teacher
 * 4. Logs activity (by admin)
 * 5. Returns created teacher
 */
export const createTeacher = async (req, res) => {
  try {
    // req.user was attached by 'protect' middleware
    // req.user.role was verified by 'authorize(['admin'])
    // So we know this is an ADMIN user

    const { name, email, password, teacherSubject } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if teacher already exists
    const existingTeacher = await User.findOne({ email });
    if (existingTeacher) {
      return res.status(400).json({
        success: false,
        message: `Teacher with email ${email} already exists`,
      });
    }

    // Create new teacher
    const newTeacher = await User.create({
      name,
      email,
      password,
      role: "teacher",
      teacherSubject: teacherSubject || [],
      isActive: true,
    });

    // Log the creation activity (by admin)
    await logActivity({
      userId: req.user._id.toString(),
      action: "Create Teacher",
      details: `Created teacher: ${newTeacher.name} (${newTeacher.email})`,
    });

    // Return created teacher (don't return password)
    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      teacher: {
        _id: newTeacher._id,
        name: newTeacher.name,
        email: newTeacher.email,
        role: newTeacher.role,
        teacherSubject: newTeacher.teacherSubject,
      },
    });
  } catch (error) {
    console.error("Create teacher error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating teacher",
      error: error.message,
    });
  }
};

/**
 * ============================================
 * EXAMPLE 2: Get All Teachers
 * ============================================
 * 
 * Route Protection: @route GET /api/teachers
 * - Required middleware: protect, authorize(['admin', 'teacher'])
 * 
 * What this function does:
 * 1. Admins see ALL teachers
 * 2. Teachers see all teachers (to collaborate)
 * 3. Students don't have access
 */
export const getTeachers = async (req, res) => {
  try {
    // req.user.role is either 'admin' or 'teacher' (verified by middleware)

    // Fetch all teachers
    const teachers = await User.find({ role: "teacher" }).select("-password");

    return res.json({
      success: true,
      count: teachers.length,
      teachers,
    });
  } catch (error) {
    console.error("Get teachers error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching teachers",
    });
  }
};

/**
 * ============================================
 * EXAMPLE 3: Take Attendance (Teacher Only)
 * ============================================
 * 
 * Route Protection: @route POST /api/teachers/:id/attendance
 * - Required middleware: protect, authorize(['admin', 'teacher']), checkPermission('takeAttendance')
 * 
 * What this function does:
 * 1. Teacher can only take attendance for their classes
 * 2. Admin can take attendance for any class
 * 3. Validates class ownership for teachers
 */
export const takeAttendance = async (req, res) => {
  try {
    // req.user contains the authenticated user (teacher or admin)
    const { classId, attendanceData } = req.body;
    const userRole = req.user.role;

    // Fetch the class
    const classRecord = await Class.findById(classId);
    if (!classRecord) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // AUTHORIZATION CHECK: Teacher can only manage their own classes
    if (userRole === "teacher") {
      // Check if this teacher owns this class
      // Assuming Class has a 'teacher' or 'teachers' field
      if (!classRecord.teacher?.equals(req.user._id)) {
        return res.status(403).json({
          success: false,
          message: "You can only take attendance for your own classes",
          teacherId: req.user._id,
          classTeacher: classRecord.teacher,
        });
      }
    }
    // If userRole === 'admin', they can take attendance for any class

    // Process attendance
    // ... save attendance data ...

    // Log activity
    await logActivity({
      userId: req.user._id.toString(),
      action: "Take Attendance",
      details: `Took attendance for class ${classRecord.name}`,
    });

    return res.json({
      success: true,
      message: "Attendance recorded successfully",
    });
  } catch (error) {
    console.error("Take attendance error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error recording attendance",
    });
  }
};

/**
 * ============================================
 * EXAMPLE 4: Get Student Profile
 * ============================================
 * 
 * Route Protection: @route GET /api/students/:id
 * - Required middleware: protect, authorize(['admin', 'student']), checkOwnership
 * 
 * What this function does:
 * 1. Admin can see any student profile
 * 2. Student can only see their own profile
 * 3. checkOwnership middleware ensures no data breach
 */
export const getStudentProfile = async (req, res) => {
  try {
    const { id } = req.params;

    // checkOwnership middleware already verified that:
    // - User is admin, OR
    // - User is student AND req.params.id === req.user._id

    const student = await User.findById(id)
      .populate("studentClass")
      .select("-password");

    if (!student || student.role !== "student") {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.json({
      success: true,
      student,
    });
  } catch (error) {
    console.error("Get student error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching student",
    });
  }
};

/**
 * ============================================
 * EXAMPLE 5: View All Students (Different rules)
 * ============================================
 * 
 * Route Protection: @route GET /api/students
 * - Required middleware: protect, authorize(['admin', 'teacher'])
 * 
 * What this function does:
 * 1. Admin sees ALL students in the system
 * 2. Teacher sees only students in their classes
 * 3. Returns different data based on role
 */
export const getStudents = async (req, res) => {
  try {
    const userRole = req.user.role;
    let students;

    if (userRole === "admin") {
      // Admin sees all students
      students = await User.find({ role: "student" })
        .populate("studentClass")
        .select("-password");
    } else if (userRole === "teacher") {
      // Teacher sees only students in their classes
      // Assuming teacher has 'teacherClasses' or 'teacherSubject'

      const teacherClasses = await Class.find({
        teacher: req.user._id, // or however you link teachers to classes
      });

      const classIds = teacherClasses.map((c) => c._id);

      students = await User.find({
        role: "student",
        studentClass: { $in: classIds },
      })
        .populate("studentClass")
        .select("-password");
    } else {
      // Should never reach here (middleware prevents students)
      return res.status(403).json({
        success: false,
        message: "Students cannot view student list",
      });
    }

    return res.json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error("Get students error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching students",
    });
  }
};

/**
 * ============================================
 * EXAMPLE 6: Delete Teacher (Admin Only)
 * ============================================
 * 
 * Route Protection: @route DELETE /api/teachers/:id
 * - Required middleware: protect, authorize(['admin'])
 * 
 * Security considerations:
 * 1. Only admin can delete
 * 2. Verify teacher exists
 * 3. Maybe don't allow deletion if teacher has classes (soft delete)
 * 4. Log the deletion
 */
export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;

    // req.user is verified to be admin by middleware

    const teacher = await User.findById(id);
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({
        success: false,
        message: "Teacher not found",
      });
    }

    // Check if teacher has active classes (optional but recommended)
    const classesWithTeacher = await Class.findOne({ teacher: id });
    if (classesWithTeacher) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete teacher with active classes. Reassign classes first.",
      });
    }

    // Soft delete: mark as inactive instead of removing
    teacher.isActive = false;
    await teacher.save();

    // Log the deletion
    await logActivity({
      userId: req.user._id.toString(),
      action: "Delete Teacher",
      details: `Deleted teacher: ${teacher.name} (${teacher.email})`,
    });

    return res.json({
      success: true,
      message: "Teacher deleted successfully",
    });
  } catch (error) {
    console.error("Delete teacher error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting teacher",
    });
  }
};

/**
 * ============================================
 * MIDDLEWARE INTEGRATION EXAMPLES
 * ============================================
 * 
 * How to wire these in your routes file:
 */

/*
// teacherRoutes.js or userRoutes.js
import { protect, authorize, checkPermission, checkOwnership } from '../middleware/authMiddleware.js';
import {
  createTeacher,
  getTeachers,
  takeAttendance,
  getStudentProfile,
  getStudents,
  deleteTeacher,
} from '../controllers/userController.js';

const router = express.Router();

// ADMIN ONLY
router.post(
  '/create',
  protect,
  authorize(['admin']),
  createTeacher
);

// ADMIN + TEACHER
router.get(
  '/',
  protect,
  authorize(['admin', 'teacher']),
  getTeachers
);

// ADMIN + TEACHER (with permission check)
router.post(
  '/attendance',
  protect,
  authorize(['admin', 'teacher']),
  checkPermission('takeAttendance'),
  takeAttendance
);

// ADMIN + STUDENT (with ownership check)
router.get(
  '/:id',
  protect,
  authorize(['admin', 'student']),
  checkOwnership,
  getStudentProfile
);

// ADMIN ONLY (destructive)
router.delete(
  '/:id',
  protect,
  authorize(['admin']),
  deleteTeacher
);

export default router;
*/

export default {
  createTeacher,
  getTeachers,
  takeAttendance,
  getStudentProfile,
  getStudents,
  deleteTeacher,
};
