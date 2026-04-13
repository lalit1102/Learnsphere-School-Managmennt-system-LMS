/**
 * Authentication & Authorization Middleware
 * Handles JWT verification and role-based access control
 */

import jwt from "jsonwebtoken";
import User from "../models/user.js";
import { ROLE_PERMISSIONS } from "../constants/roles.js";

/**
 * MIDDLEWARE: Verify JWT token and attach user to request
 * Sets req.user with user data (excluding password)
 * 
 * @usage Apply to all protected routes
 * Example: router.get('/profile', protect, getProfile)
 */
export const protect = async (req, res, next) => {
  let token;

  // check for token in cookies
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: "Not authorized, no token provided" 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach authenticated user to request
    req.user = await User.findById(decoded.userId).select("-password");

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ 
        success: false,
        message: "User not found or inactive" 
      });
    }

    next();
  } catch (error) {
    console.error("Auth error:", error.message);
    return res.status(401).json({ 
      success: false,
      message: "Not authorized, invalid token" 
    });
  }
};

/**
 * MIDDLEWARE: Role-based authorization
 * Checks if user's role is in the list of allowed roles
 * MUST be used AFTER protect middleware
 * 
 * @param {string[]} roles - Array of allowed roles
 * @returns {Function} Express middleware
 * 
 * @usage Multiple roles allowed
 * Example: router.post('/create', protect, authorize(['admin', 'teacher']), createHandler)
 * 
 * @usage Only admin
 * Example: router.delete('/delete/:id', protect, authorize(['admin']), deleteHandler)
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized, user not found" 
      });
    }

    if (!Array.isArray(roles) || roles.length === 0) {
      return res.status(500).json({ 
        success: false,
        message: "Server error: Invalid roles configuration" 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your role '${req.user.role}' is not authorized for this action.`,
        userRole: req.user.role,
        requiredRoles: roles,
      });
    }

    // User has permission to proceed
    next();
  };
};

/**
 * MIDDLEWARE: Admin-only authorization
 * Shorthand for authorize(['admin'])
 * 
 * @usage
 * Example: router.delete('/user/:id', protect, adminOnly, deleteUser)
 */
export const adminOnly = (req, res, next) => {
  return authorize(['admin'])(req, res, next);
};

/**
 * MIDDLEWARE: Teacher or Admin authorization
 * Shorthand for authorize(['admin', 'teacher'])
 * 
 * @usage
 * Example: router.post('/create-exam', protect, teacherOrAdmin, createExam)
 */
export const teacherOrAdmin = (req, res, next) => {
  return authorize(['admin', 'teacher'])(req, res, next);
};

/**
 * MIDDLEWARE: Check specific permission
 * Validates user permission using ROLE_PERMISSIONS matrix
 * 
 * @param {string} permission - Permission key to check
 * @returns {Function} Express middleware
 * 
 * @usage
 * Example: router.post('/create-exam', protect, checkPermission('createExam'), createExam)
 */
export const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authorized" 
      });
    }

    const rolePermissions = ROLE_PERMISSIONS[req.user.role] || {};
    const customPermissions = (req.user.requestedPermissions || []).reduce((acc, perm) => {
      acc[perm] = true;
      return acc;
    }, {});
    const userPermissions = { ...rolePermissions, ...customPermissions };

    if (!userPermissions[permission]) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. You don't have '${permission}' permission.`,
        userRole: req.user.role,
        requiredPermission: permission,
      });
    }

    next();
  };
};

/**
 * MIDDLEWARE: Check if user is teacher and owns the class (optional)
 * For more granular control - teachers can only modify their classes
 * 
 * @usage
 * Example: router.patch('/class/:id', protect, checkTeacherOwnership, updateClass)
 */
export const checkTeacherOwnership = (req, res, next) => {
  if (req.user.role === 'admin') {
    // Admins can access everything
    return next();
  }

  if (req.user.role === 'teacher') {
    // Teachers can only access their assigned classes
    // This assumes Class has a 'teacher' field
    if (!req.user.teacherSubject || req.user.teacherSubject.length === 0) {
      return res.status(403).json({
        success: false,
        message: "You have no classes assigned",
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Only teachers and admins can access this resource",
  });
};

/**
 * MIDDLEWARE: Check if user is accessing their own data
 * Students can only view their own profile/data
 * 
 * @usage
 * Example: router.get('/student/:id', protect, checkOwnership, getStudent)
 */
export const checkOwnership = (req, res, next) => {
  if (req.user.role === 'admin') {
    // Admins can access everything
    return next();
  }

  const resourceId = req.params.id;
  const userId = req.user._id.toString();

  if (resourceId !== userId) {
    return res.status(403).json({
      success: false,
      message: "You can only access your own data",
    });
  }

  next();
};

export default protect;