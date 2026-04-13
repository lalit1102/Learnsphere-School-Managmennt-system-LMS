/**
 * ENHANCED CLASS MANAGEMENT CONTROLLER
 * With role-based access control
 * 
 * Features:
 * - Admin: Can manage all classes
 * - Teacher: Can see only assigned classes, manage students
 * - Student: Can see only their class
 */

import Class from "../models/class.js";
import User from "../models/user.js";
import { logActivity } from "../utils/activitieslog.js";

/**
 * ============================================
 * CLASS CREATION & MANAGEMENT (ADMIN ONLY)
 * ============================================
 */

/**
 * CREATE: Create a new class
 * Only ADMIN can create classes
 * 
 * @route POST /api/classes/create
 * @access Private - Admin only
 * @body {Object} { name, academicYear, classTeacher, capacity, subjects }
 * @returns {Object} Created class object
 */
export const createClass = async (req, res) => {
  try {
    // req.user verified by 'protect' middleware
    // req.user.role verified by 'authorize(['admin'])' middleware
    
    const { name, academicYear, classTeacher, capacity, subjects } = req.body;

    // Validate input
    if (!name || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Class name and academic year are required",
      });
    }

    // Check for duplicate class
    const existingClass = await Class.findOne({ name, academicYear });
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: `Class "${name}" already exists for this academic year`,
      });
    }

    // Validate teacher if assigned
    if (classTeacher) {
      const teacher = await User.findById(classTeacher);
      if (!teacher || teacher.role !== "teacher") {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID or teacher not found",
        });
      }
    }

    // Create class
    const newClass = await Class.create({
      name,
      academicYear,
      classTeacher: classTeacher || null,
      capacity: capacity || 40,
      subjects: subjects || [],
    });

    // Populate references
    await newClass.populate([
      { path: "academicYear", select: "name" },
      { path: "classTeacher", select: "name email" },
    ]);

    // Log activity
    await logActivity({
      userId: req.user._id.toString(),
      action: "Create Class",
      details: `Created class: ${newClass.name}`,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    console.error("Create class error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error creating class",
      error: error.message,
    });
  }
};

/**
 * GET ALL CLASSES: Role-based filtering
 * - Admin: See ALL classes
 * - Teacher: See only ASSIGNED classes
 * - Student: See only THEIR class
 * 
 * @route GET /api/classes
 * @access Private - Admin, Teacher, Student
 * @query {String} search - Search by class name
 * @query {Number} page - Pagination page number
 * @query {Number} limit - Results per page
 * @returns {Array} Array of classes visible to user
 */
export const getAllClasses = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";

    let query = {};

    // Add search filter
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Role-based filtering
    if (userRole === "admin") {
      // Admin sees ALL classes
      // No additional filter needed
    } else if (userRole === "teacher") {
      // Teacher sees ONLY classes they teach
      query.classTeacher = userId;
    } else if (userRole === "student") {
      // Student sees ONLY their assigned class
      query.students = userId;
    } else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view classes",
      });
    }

    // Execute query with pagination
    const [total, classes] = await Promise.all([
      Class.countDocuments(query),
      Class.find(query)
        .populate("academicYear", "name")
        .populate("classTeacher", "name email")
        .populate("students", "name email")
        .populate("subjects", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    return res.json({
      success: true,
      count: classes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      userRole,
      classes,
    });
  } catch (error) {
    console.error("Get classes error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching classes",
      error: error.message,
    });
  }
};

/**
 * GET SINGLE CLASS: Role-based access
 * - Admin: Can view any class
 * - Teacher: Can view only assigned classes
 * - Student: Can view only their class
 * 
 * @route GET /api/classes/:id
 * @access Private - Admin, Teacher (assigned), Student (own class)
 * @param {String} id - Class ID
 * @returns {Object} Class object with full details
 */
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Fetch class
    const classData = await Class.findById(id)
      .populate("academicYear", "name")
      .populate("classTeacher", "name email role")
      .populate({
        path: "students",
        select: "name email role studentClass",
      })
      .populate("subjects", "name");

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Authorization check based on role
    if (userRole === "admin") {
      // Admin can view any class
      return res.json({
        success: true,
        class: classData,
      });
    } else if (userRole === "teacher") {
      // Teacher can only view assigned classes
      if (!classData.classTeacher?.equals(userId)) {
        return res.status(403).json({
          success: false,
          message: "You can only view your assigned classes",
        });
      }
      return res.json({
        success: true,
        class: classData,
      });
    } else if (userRole === "student") {
      // Student can only view their own class
      const isStudent = classData.students.some((student) =>
        student._id.equals(userId)
      );
      
      if (!isStudent) {
        return res.status(403).json({
          success: false,
          message: "You can only view your own class",
        });
      }
      return res.json({
        success: true,
        class: classData,
      });
    }

    return res.status(403).json({
      success: false,
      message: "Unauthorized",
    });
  } catch (error) {
    console.error("Get class error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching class",
    });
  }
};

/**
 * UPDATE CLASS: Admin only
 * Only ADMIN can modify class details
 * 
 * @route PATCH /api/classes/:id
 * @access Private - Admin only
 * @param {String} id - Class ID
 * @body {Object} Updated fields
 * @returns {Object} Updated class object
 */
export const updateClass = async (req, res) => {
  try {
    // Role verified by authorize(['admin']) middleware
    const { id } = req.params;
    const { name, academicYear, capacity, subjects, classTeacher } = req.body;

    // Fetch class
    const classData = await Class.findById(id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Check for duplicate name (if updating name)
    if (name && name !== classData.name) {
      const duplicate = await Class.findOne({
        name,
        academicYear: academicYear || classData.academicYear,
        _id: { $ne: id },
      });
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: "Class with this name already exists for this academic year",
        });
      }
    }

    // Validate teacher if provided
    if (classTeacher && classTeacher !== null) {
      const teacher = await User.findById(classTeacher);
      if (!teacher || teacher.role !== "teacher") {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID",
        });
      }
    }

    // Update fields
    if (name) classData.name = name;
    if (academicYear) classData.academicYear = academicYear;
    if (capacity) classData.capacity = capacity;
    if (subjects) classData.subjects = subjects;
    if (classTeacher === null || classTeacher === "") {
      classData.classTeacher = null;
    } else if (classTeacher) {
      classData.classTeacher = classTeacher;
    }

    const updatedClass = await classData.save();

    // Populate references
    await updatedClass.populate([
      { path: "academicYear", select: "name" },
      { path: "classTeacher", select: "name email" },
    ]);

    // Log activity
    await logActivity({
      userId: req.user._id.toString(),
      action: "Update Class",
      details: `Updated class: ${updatedClass.name}`,
    });

    return res.json({
      success: true,
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Update class error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error updating class",
    });
  }
};

/**
 * DELETE CLASS: Admin only
 * Only ADMIN can delete classes
 * 
 * @route DELETE /api/classes/:id
 * @access Private - Admin only
 * @param {String} id - Class ID
 * @returns {Object} Success message
 */
export const deleteClass = async (req, res) => {
  try {
    // Role verified by authorize(['admin']) middleware
    const { id } = req.params;

    const deletedClass = await Class.findByIdAndDelete(id);

    if (!deletedClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Log activity
    await logActivity({
      userId: req.user._id.toString(),
      action: "Delete Class",
      details: `Deleted class: ${deletedClass.name}`,
    });

    return res.json({
      success: true,
      message: "Class deleted successfully",
      class: deletedClass,
    });
  } catch (error) {
    console.error("Delete class error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error deleting class",
    });
  }
};

/**
 * ============================================
 * CLASS MEMBERSHIP MANAGEMENT (ADMIN & TEACHER)
 * ============================================
 */

/**
 * ADD STUDENT TO CLASS
 * Admin can add to any class
 * Teacher can add only to their own class
 * 
 * @route POST /api/classes/:id/students/add
 * @access Private - Admin, Teacher (own class)
 * @body {Object} { studentId }
 */
export const addStudentToClass = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const { studentId } = req.body;
    const userRole = req.user.role;
    const userId = req.user._id;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required",
      });
    }

    // Fetch class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Authorization check
    if (userRole === "teacher" && !classData.classTeacher?.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only add students to your own class",
      });
    }

    // Verify student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== "student") {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID or user is not a student",
      });
    }

    // Check if student already in class
    if (classData.students.includes(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Student already in this class",
      });
    }

    // Check capacity
    if (classData.students.length >= classData.capacity) {
      return res.status(400).json({
        success: false,
        message: `Class is at full capacity (${classData.capacity})`,
      });
    }

    // Add student
    classData.students.push(studentId);
    await classData.save();

    // Update student's class reference
    student.studentClass = classId;
    await student.save();

    // Log activity
    await logActivity({
      userId: req.user._id.toString(),
      action: "Add Student to Class",
      details: `Added student ${student.name} to class ${classData.name}`,
    });

    return res.json({
      success: true,
      message: "Student added to class successfully",
      class: classData,
    });
  } catch (error) {
    console.error("Add student error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error adding student",
    });
  }
};

/**
 * REMOVE STUDENT FROM CLASS
 * Admin can remove from any class
 * Teacher can remove from their own class
 * 
 * @route DELETE /api/classes/:id/students/:studentId
 * @access Private - Admin, Teacher (own class)
 */
export const removeStudentFromClass = async (req, res) => {
  try {
    const { id: classId, studentId } = req.params;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Fetch class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Authorization check
    if (userRole === "teacher" && !classData.classTeacher?.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only remove students from your own class",
      });
    }

    // Remove student from class
    classData.students = classData.students.filter(
      (id) => !id.equals(studentId)
    );
    await classData.save();

    // Clear student's class reference
    const student = await User.findById(studentId);
    if (student) {
      student.studentClass = null;
      await student.save();
    }

    // Log activity
    await logActivity({
      userId: req.user._id.toString(),
      action: "Remove Student from Class",
      details: `Removed student from class ${classData.name}`,
    });

    return res.json({
      success: true,
      message: "Student removed from class successfully",
      class: classData,
    });
  } catch (error) {
    console.error("Remove student error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error removing student",
    });
  }
};

/**
 * GET CLASS STUDENTS
 * Admin can view any class students
 * Teacher can view their class students
 * Student can view classmates
 * 
 * @route GET /api/classes/:id/students
 * @access Private - Admin, Teacher (own), Student (same class)
 */
export const getClassStudents = async (req, res) => {
  try {
    const { id: classId } = req.params;
    const userRole = req.user.role;
    const userId = req.user._id;

    // Fetch class
    const classData = await Class.findById(classId).populate(
      "students",
      "name email role"
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    // Authorization check
    if (userRole === "teacher" && !classData.classTeacher?.equals(userId)) {
      return res.status(403).json({
        success: false,
        message: "You can only view students in your own class",
      });
    } else if (userRole === "student") {
      // Student can only view if they're in this class
      const isInClass = classData.students.some((student) =>
        student._id.equals(userId)
      );
      if (!isInClass) {
        return res.status(403).json({
          success: false,
          message: "You can only view students in your own class",
        });
      }
    }

    return res.json({
      success: true,
      count: classData.students.length,
      students: classData.students,
    });
  } catch (error) {
    console.error("Get class students error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error fetching students",
    });
  }
};

export default {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
  getClassStudents,
};
