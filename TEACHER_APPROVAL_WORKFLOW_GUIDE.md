================================================================================
              LEARNSPHERE - TEACHER APPROVAL WORKFLOW GUIDE
                     Developer Implementation Guide v1.0
================================================================================


OVERVIEW
--------
This guide provides a complete implementation of the Teacher Approval Workflow,
including backend API routes, MongoDB schemas, React components, and workflow
diagrams for the LearnSphere LMS.

The workflow ensures that teachers go through an approval process before
gaining full access to the system, maintaining quality control and security.


================================================================================
                        1. WORKFLOW DIAGRAM (Text)
================================================================================

                    TEACHER APPROVAL WORKFLOW DIAGRAM

┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                               │
│  TEACHER REGISTRATION                                                        │
│         │                                                                    │
│         ├─> Teacher creates account (email, password, qualification)        │
│         │                                                                    │
│         └─> Database: Create User with status "PENDING_APPROVAL"            │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  TEACHER LOGIN (Before Approval)                                            │
│         │                                                                    │
│         ├─> Teacher logs in successfully                                    │
│         │                                                                    │
│         ├─> System checks: approvalStatus === "PENDING_APPROVAL"            │
│         │                                                                    │
│         └─> Redirect to "Awaiting Approval" page                            │
│                // Cannot access dashboard until approved                     │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ADMIN REVIEW                                                                │
│         │                                                                    │
│         ├─> Admin logs in and navigates to Settings > Pending Approvals    │
│         │                                                                    │
│         ├─> Admin sees list of pending teacher requests                     │
│         │   - Teacher name, email, qualifications, request date             │
│         │   - [Approve] [Reject] [View Details] buttons                     │
│         │                                                                    │
│         └─> Database: Query User.find({ approvalStatus: "PENDING_APPROVAL"})│
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ADMIN APPROVE/REJECT                                                        │
│         │                                                                    │
│         ├─> Admin clicks "Approve" or "Reject"                              │
│         │                                                                    │
│         ├─ If APPROVE:                                                      │
│         │  ├─> Update User.approvalStatus = "APPROVED"                     │
│         │  ├─> Assign default teacher permissions                          │
│         │  └─> Create ActivityLog entry                                    │
│         │                                                                    │
│         ├─ If REJECT:                                                       │
│         │  ├─> Update User.approvalStatus = "REJECTED"                     │
│         │  ├─> Store rejection reason                                      │
│         │  └─> Create ActivityLog entry                                    │
│         │                                                                    │
│         └─> Send Notification to Teacher                                   │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  TEACHER NOTIFICATION                                                        │
│         │                                                                    │
│         ├─ If APPROVED:                                                     │
│         │  ├─> In-app notification: "Your account has been approved!"      │
│         │  ├─> Email: "Welcome to LearnSphere"                             │
│         │  ├─> Notification redirects to Dashboard                         │
│         │  └─> Display assigned classes                                    │
│         │                                                                    │
│         ├─ If REJECTED:                                                     │
│         │  ├─> Notification: "Your request was rejected: [reason]"        │
│         │  ├─> Option to resubmit or contact admin                         │
│         │  └─> Account remains in "REJECTED" status                        │
│         │                                                                    │
│         └─> Teacher logs in again to see updated status                    │
│                                                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  TEACHER GAINS ACCESS (After Approval)                                      │
│         │                                                                    │
│         ├─> Teacher logs in                                                 │
│         │                                                                    │
│         ├─> System checks: approvalStatus === "APPROVED"                   │
│         │                                                                    │
│         ├─> Redirect to Main Dashboard                                      │
│         │   - Show assigned classes                                         │
│         │   - Show student list                                             │
│         │   - Show assignment/exam creation options                         │
│         │                                                                    │
│         └─> Full system access enabled                                      │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘


================================================================================
                      2. MONGODB SCHEMAS & MODELS
================================================================================

// ============================================================================
// FILE: Backend/src/models/user.js (EXTENDED FOR TEACHER APPROVAL)
// ============================================================================

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    // BASIC INFO
    name: {
      type: String,
      required: [true, "Please provide a name"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      select: false,
    },

    // ROLE & PERMISSIONS
    role: {
      type: String,
      enum: ["admin", "teacher", "student", "parent"],
      default: "student",
    },
    permissions: [
      {
        type: String,
        // e.g., "create_assignment", "view_attendance", "approve_requests"
      },
    ],

    // TEACHER APPROVAL STATUS
    approvalStatus: {
      type: String,
      enum: ["PENDING_APPROVAL", "APPROVED", "REJECTED"],
      default: "PENDING_APPROVAL", // Teachers start as PENDING
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to admin who approved
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },

    // TEACHER SPECIFIC
    designation: {
      type: String,
      enum: ["Head Master", "Principal", "Teacher", "Coordinator"],
      default: "Teacher",
    },
    contact: {
      type: String,
      match: [/^\d{10}$/, "Please provide a valid 10-digit phone number"],
    },
    qualifications: {
      type: String,
      // e.g., "B.A., M.Ed, B.Tech"
    },
    experience: {
      type: Number,
      // Years of teaching experience
    },
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    assignedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    // METADATA
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

export default mongoose.model("User", userSchema);


// ============================================================================
// FILE: Backend/src/models/teacherRequest.js (DETAILED REQUEST TRACKING)
// ============================================================================

import mongoose from "mongoose";

const teacherRequestSchema = new mongoose.Schema(
  {
    // TEACHER INFORMATION
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    teacherName: String,
    teacherEmail: String,
    contact: String,

    // QUALIFICATIONS & EXPERTISE
    qualifications: {
      degree: String,        // e.g., "B.A.", "B.Tech", "M.Ed"
      specialization: String, // e.g., "Mathematics", "Physics"
      experience: Number,     // Years of experience
    },

    // REQUEST DETAILS
    requestStatus: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    submissionDate: {
      type: Date,
      default: Date.now,
    },

    // APPROVAL DETAILS
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin who reviewed
      default: null,
    },
    reviewDate: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },

    // ASSIGNMENT (After Approval)
    assignedClasses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    assignedSubjects: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subject",
      },
    ],

    // METADATA
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("TeacherRequest", teacherRequestSchema);


================================================================================
                    3. BACKEND API ROUTES & CONTROLLERS
================================================================================

// ============================================================================
// FILE: Backend/src/routes/teacherRequestRoutes.js
// ============================================================================

import express from "express";
import {
  submitTeacherRequest,
  getPendingRequests,
  approvTeacher,
  rejectTeacher,
  getRequestStatus,
} from "../controllers/teacherRequestController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: Teacher submits request
router.post("/submit", protect, submitTeacherRequest);

// Public: Teacher checks their request status
router.get("/status/:userId", protect, getRequestStatus);

// Admin Only: Get all pending requests
router.get(
  "/pending",
  protect,
  authorize("admin"),
  getPendingRequests
);

// Admin Only: Approve a teacher request
router.post(
  "/approve/:requestId",
  protect,
  authorize("admin"),
  approvTeacher
);

// Admin Only: Reject a teacher request
router.post(
  "/reject/:requestId",
  protect,
  authorize("admin"),
  rejectTeacher
);

export default router;


// ============================================================================
// FILE: Backend/src/controllers/teacherRequestController.js
// ============================================================================

import User from "../models/user.js";
import TeacherRequest from "../models/teacherRequest.js";
import ActivityLog from "../models/activityLog.js";
import { sendNotification } from "../utils/notifications.js";

// 1. SUBMIT TEACHER REQUEST (First-time teacher registration)
export const submitTeacherRequest = async (req, res) => {
  try {
    const { qualifications, experience, contact } = req.body;
    const userId = req.user._id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if already submitted
    const existingRequest = await TeacherRequest.findOne({
      teacherId: userId,
      requestStatus: { $in: ["PENDING", "APPROVED"] },
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending or approved request",
      });
    }

    // Create new teacher request
    const teacherRequest = new TeacherRequest({
      teacherId: userId,
      teacherName: user.name,
      teacherEmail: user.email,
      contact,
      qualifications: {
        degree: qualifications.degree,
        specialization: qualifications.specialization,
        experience,
      },
    });

    await teacherRequest.save();

    // Log activity
    await ActivityLog.create({
      userId,
      action: "TEACHER_REQUEST_SUBMITTED",
      entityType: "TeacherRequest",
      entityId: teacherRequest._id,
      changes: { status: "PENDING" },
    });

    res.status(201).json({
      success: true,
      message: "Teacher request submitted successfully",
      request: teacherRequest,
      nextSteps:
        "Your request will be reviewed by an administrator. You will be notified once it is approved or rejected.",
    });
  } catch (error) {
    console.error("Error submitting teacher request:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 2. GET PENDING REQUESTS (Admin Dashboard)
export const getPendingRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = "-submissionDate" } = req.query;

    const requests = await TeacherRequest.find({ requestStatus: "PENDING" })
      .populate("teacherId", "name email contact")
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await TeacherRequest.countDocuments({
      requestStatus: "PENDING",
    });

    res.status(200).json({
      success: true,
      count: requests.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 3. APPROVE TEACHER REQUEST
export const approvTeacher = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { assignedClasses = [], assignedSubjects = [] } = req.body;
    const adminId = req.user._id;

    // Find request
    const teacherRequest = await TeacherRequest.findById(requestId);
    if (!teacherRequest) {
      return res.status(404).json({
        success: false,
        message: "Teacher request not found",
      });
    }

    if (teacherRequest.requestStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${teacherRequest.requestStatus}`,
      });
    }

    // Update Teacher Request
    teacherRequest.requestStatus = "APPROVED";
    teacherRequest.reviewedBy = adminId;
    teacherRequest.reviewDate = new Date();
    teacherRequest.assignedClasses = assignedClasses;
    teacherRequest.assignedSubjects = assignedSubjects;
    await teacherRequest.save();

    // Update User record
    const user = await User.findById(teacherRequest.teacherId);
    user.approvalStatus = "APPROVED";
    user.approvedBy = adminId;
    user.approvalDate = new Date();
    user.role = "teacher"; // Set role to teacher
    user.assignedClasses = assignedClasses;
    user.assignedSubjects = assignedSubjects;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: adminId,
      action: "TEACHER_APPROVED",
      entityType: "TeacherRequest",
      entityId: requestId,
      changes: {
        previousStatus: "PENDING",
        newStatus: "APPROVED",
        assignedClasses,
        assignedSubjects,
      },
    });

    // Send notification to teacher
    await sendNotification({
      userId: teacherRequest.teacherId,
      type: "APPROVAL",
      title: "Account Approved!",
      message: `Your teacher account has been approved by ${req.user.name}. You can now log in and access your classes.`,
      actionUrl: "/dashboard",
    });

    res.status(200).json({
      success: true,
      message: "Teacher approved successfully",
      data: {
        teacherRequest,
        user,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. REJECT TEACHER REQUEST
export const rejectTeacher = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason = "Request does not meet requirements" } = req.body;
    const adminId = req.user._id;

    // Find request
    const teacherRequest = await TeacherRequest.findById(requestId);
    if (!teacherRequest) {
      return res.status(404).json({
        success: false,
        message: "Teacher request not found",
      });
    }

    if (teacherRequest.requestStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Request is already ${teacherRequest.requestStatus}`,
      });
    }

    // Update Teacher Request
    teacherRequest.requestStatus = "REJECTED";
    teacherRequest.reviewedBy = adminId;
    teacherRequest.reviewDate = new Date();
    teacherRequest.rejectionReason = rejectionReason;
    await teacherRequest.save();

    // Update User record
    const user = await User.findById(teacherRequest.teacherId);
    user.approvalStatus = "REJECTED";
    user.rejectionReason = rejectionReason;
    await user.save();

    // Log activity
    await ActivityLog.create({
      userId: adminId,
      action: "TEACHER_REJECTED",
      entityType: "TeacherRequest",
      entityId: requestId,
      changes: {
        previousStatus: "PENDING",
        newStatus: "REJECTED",
        reason: rejectionReason,
      },
    });

    // Send notification to teacher
    await sendNotification({
      userId: teacherRequest.teacherId,
      type: "REJECTION",
      title: "Request Not Approved",
      message: `Your teacher request was not approved. Reason: ${rejectionReason}. Please contact the administrator for more information.`,
      actionUrl: "/contact-admin",
    });

    res.status(200).json({
      success: true,
      message: "Teacher request rejected",
      data: teacherRequest,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 5. GET REQUEST STATUS (Teacher checks their request)
export const getRequestStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const request = await TeacherRequest.findOne({
      teacherId: userId,
    });

    res.status(200).json({
      success: true,
      approvalStatus: user.approvalStatus,
      request: request || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ============================================================================
// FILE: Backend/src/middleware/authMiddleware.js (APPROVAL CHECK)
// ============================================================================

import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // CHECK APPROVAL STATUS FOR TEACHERS
    if (req.user.role === "teacher") {
      if (req.user.approvalStatus === "PENDING_APPROVAL") {
        return res.status(403).json({
          success: false,
          message: "Your account is pending admin approval",
          approvalStatus: "PENDING_APPROVAL",
        });
      }

      if (req.user.approvalStatus === "REJECTED") {
        return res.status(403).json({
          success: false,
          message: `Your account was rejected. Reason: ${req.user.rejectionReason}`,
          approvalStatus: "REJECTED",
        });
      }
    }

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized for this action`,
        requiredRoles: roles,
      });
    }
    next();
  };
};


================================================================================
                   4. REACT COMPONENTS - FRONTEND
================================================================================

// ============================================================================
// FILE: client/src/components/auth/TeacherRequestForm.jsx
// DESCRIPTION: Teacher submits approval request on first login
// ============================================================================

"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";
import { toast } from "sonner";

export const TeacherRequestForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    qualifications: {
      degree: "",
      specialization: "",
    },
    experience: 0,
    contact: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.qualifications.degree || !formData.contact) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await api.post("/teacher-requests/submit", formData);

      if (response.data.success) {
        setSubmitted(true);
        toast.success("Request submitted successfully!");
        onSuccess?.();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to submit request"
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Request Submitted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your teacher account request has been submitted successfully!
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next?</strong>
              <br />
              An administrator will review your qualifications and approve your
              access. You will receive a notification once your account is
              approved.
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Estimated approval time: 1-3 business days
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Teacher Profile</CardTitle>
        <CardDescription>
          Submit your qualification details for admin approval
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Degree */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Degree *
            </label>
            <input
              type="text"
              name="qualifications.degree"
              value={formData.qualifications.degree}
              onChange={handleChange}
              placeholder="e.g., B.A., B.Tech, M.Ed"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Specialization */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Specialization
            </label>
            <input
              type="text"
              name="qualifications.specialization"
              value={formData.qualifications.specialization}
              onChange={handleChange}
              placeholder="e.g., Mathematics, Physics, English"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Experience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Years of Experience
            </label>
            <input
              type="number"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Number *
            </label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              placeholder="10-digit phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Info Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              Your request will be reviewed by an administrator. You will
              receive a notification once approved or rejected.
            </p>
          </div>

          {/* Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TeacherRequestForm;


// ============================================================================
// FILE: client/src/pages/settings/PendingApprovals.jsx
// DESCRIPTION: Admin dashboard to approve/reject teacher requests
// ============================================================================

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader, AlertCircle, User } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const PendingApprovalsAdmin = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  // Check authorization
  if (user?.role !== "admin") {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Access Denied</p>
            <p className="text-sm text-red-700">
              Only admins can access this page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setLoading(true);
      const response = await api.get("/teacher-requests/pending");
      if (response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setApproving((prev) => ({ ...prev, [requestId]: true }));
    try {
      const response = await api.post(
        `/teacher-requests/approve/${requestId}`,
        {
          assignedClasses: [],
          assignedSubjects: [],
        }
      );

      if (response.data.success) {
        toast.success("Teacher approved successfully!");
        setRequests(
          requests.filter((r) => r._id !== requestId)
        );
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to approve request"
      );
    } finally {
      setApproving((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectionReason("");
    setShowRejectDialog(true);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    setApproving((prev) => ({
      ...prev,
      [selectedRequest._id]: true,
    }));

    try {
      const response = await api.post(
        `/teacher-requests/reject/${selectedRequest._id}`,
        { rejectionReason }
      );

      if (response.data.success) {
        toast.success("Teacher request rejected");
        setRequests(
          requests.filter((r) => r._id !== selectedRequest._id)
        );
        setShowRejectDialog(false);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to reject request"
      );
    } finally {
      setApproving((prev) => ({
        ...prev,
        [selectedRequest._id]: false,
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Pending Teacher Approvals
        </h1>
        <p className="text-gray-600 mt-2">
          Review and approve teaching staff applications
        </p>
      </div>

      {requests.length === 0 ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800">
                No pending teacher requests at the moment
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <Card key={request._id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      {request.teacherName}
                    </CardTitle>
                    <CardDescription>
                      {request.teacherEmail}
                    </CardDescription>
                  </div>
                  <div className="text-xs bg-gray-100 px-3 py-1 rounded-full">
                    {new Date(request.submissionDate).toLocaleDateString()}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Qualifications */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Degree
                    </p>
                    <p className="font-semibold">
                      {request.qualifications?.degree || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Specialization
                    </p>
                    <p className="font-semibold">
                      {request.qualifications?.specialization ||
                        "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">
                      Experience
                    </p>
                    <p className="font-semibold">
                      {request.qualifications?.experience || 0}{" "}
                      years
                    </p>
                  </div>
                </div>

                {/* Contact */}
                <div className="text-sm">
                  <p className="text-gray-500">Contact:</p>
                  <p className="font-semibold">{request.contact}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => handleApprove(request._id)}
                    disabled={approving[request._id]}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {approving[request._id] ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={() => handleRejectClick(request)}
                    disabled={approving[request._id]}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Rejection Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Teacher Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting{" "}
              {selectedRequest?.teacherName}'s request.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 h-24"
            />
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowRejectDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={approving[selectedRequest?._id]}
              className="bg-red-600 hover:bg-red-700"
            >
              {approving[selectedRequest?._id] ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingApprovalsAdmin;


// ============================================================================
// FILE: client/src/pages/auth/TeacherApprovalStatus.jsx
// DESCRIPTION: Status page for teachers awaiting approval
// ============================================================================

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, XCircle, Loader, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const TeacherApprovalStatus = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApprovalStatus();
    // Poll every 30 seconds
    const interval = setInterval(fetchApprovalStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchApprovalStatus = async () => {
    try {
      const response = await api.get(
        `/teacher-requests/status/${user._id}`
      );
      if (response.data.success) {
        setStatus(response.data.approvalStatus);
      }
    } catch (error) {
      console.error("Failed to fetch status:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === "APPROVED") {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            Account Approved!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-green-800">
            Your teacher account has been approved by the administrator. You
            now have full access to the system.
          </p>
          <Button className="bg-green-600 hover:bg-green-700">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === "REJECTED") {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="w-5 h-5" />
            Request Not Approved
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-800">
            Your teacher request was rejected. Please contact the administrator
            for more information.
          </p>
          <Button variant="outline">Contact Administrator</Button>
        </CardContent>
      </Card>
    );
  }

  // PENDING_APPROVAL
  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600">
          <Clock className="w-5 h-5" />
          Awaiting Approval
        </CardTitle>
        <CardDescription>
          Your application is being reviewed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white border rounded p-4 space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Status:</strong> Pending Review
          </p>
          <p className="text-sm text-gray-600">
            <strong>Submitted:</strong>{" "}
            {new Date().toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Estimated Wait:</strong> 1-3 business days
          </p>
        </div>

        <div className="bg-blue-100 border border-blue-300 rounded p-4">
          <p className="text-sm text-blue-800">
            💡 <strong>What happens next?</strong>
            <br />
            An administrator will review your qualifications and contact
            information. You will receive a notification once your account
            status changes.
          </p>
        </div>

        <div className="pt-2">
          <p className="text-xs text-gray-500">
            Page auto-refreshes every 30 seconds. Feel free to close this page
            and check back later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherApprovalStatus;


================================================================================
                     5. API REQUEST/RESPONSE EXAMPLES
================================================================================

// ============================================================================
// 1. TEACHER SUBMITS REQUEST
// ============================================================================

REQUEST:
POST /api/teacher-requests/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "qualifications": {
    "degree": "B.A.",
    "specialization": "Mathematics"
  },
  "experience": 5,
  "contact": "9876543210"
}

RESPONSE (Success):
{
  "success": true,
  "message": "Teacher request submitted successfully",
  "request": {
    "_id": "605c72ef1a1234567890abcd",
    "teacherId": "505c72ef1a1234567890aaa",
    "teacherName": "John Smith",
    "teacherEmail": "john@school.com",
    "contact": "9876543210",
    "qualifications": {
      "degree": "B.A.",
      "specialization": "Mathematics",
      "experience": 5
    },
    "requestStatus": "PENDING",
    "submissionDate": "2026-04-07T10:30:00Z"
  },
  "nextSteps": "Your request will be reviewed..."
}

RESPONSE (Error - Already Submitted):
{
  "success": false,
  "message": "You already have a pending or approved request"
}


// ============================================================================
// 2. ADMIN FETCHES PENDING REQUESTS
// ============================================================================

REQUEST:
GET /api/teacher-requests/pending?page=1&limit=10
Authorization: Bearer <admin_token>

RESPONSE:
{
  "success": true,
  "count": 3,
  "total": 5,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "605c72ef1a1234567890abcd",
      "teacherId": {
        "_id": "505c72ef1a1234567890aaa",
        "name": "John Smith",
        "email": "john@school.com",
        "contact": "9876543210"
      },
      "qualifications": {
        "degree": "B.A.",
        "specialization": "Mathematics",
        "experience": 5
      },
      "requestStatus": "PENDING",
      "submissionDate": "2026-04-07T10:30:00Z"
    },
    {
      "_id": "605c72ef1a1234567890abce",
      "teacherId": {
        "_id": "505c72ef1a1234567890aab",
        "name": "Sarah Johnson",
        "email": "sarah@school.com",
        "contact": "9876543211"
      },
      "qualifications": {
        "degree": "M.Sc.",
        "specialization": "Physics",
        "experience": 8
      },
      "requestStatus": "PENDING",
      "submissionDate": "2026-04-06T09:15:00Z"
    }
  ]
}


// ============================================================================
// 3. ADMIN APPROVES TEACHER
// ============================================================================

REQUEST:
POST /api/teacher-requests/approve/605c72ef1a1234567890abcd
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "assignedClasses": ["605c72ef1a1234567890abc1", "605c72ef1a1234567890abc2"],
  "assignedSubjects": ["505c72ef1a1234567890xyz1"]
}

RESPONSE:
{
  "success": true,
  "message": "Teacher approved successfully",
  "data": {
    "teacherRequest": {
      "_id": "605c72ef1a1234567890abcd",
      "teacherId": "505c72ef1a1234567890aaa",
      "requestStatus": "APPROVED",
      "reviewedBy": "605c72ef1a1234567890admin",
      "reviewDate": "2026-04-07T14:00:00Z",
      "assignedClasses": [
        "605c72ef1a1234567890abc1",
        "605c72ef1a1234567890abc2"
      ],
      "assignedSubjects": [
        "505c72ef1a1234567890xyz1"
      ]
    },
    "user": {
      "_id": "505c72ef1a1234567890aaa",
      "name": "John Smith",
      "email": "john@school.com",
      "role": "teacher",
      "approvalStatus": "APPROVED",
      "approvalDate": "2026-04-07T14:00:00Z"
    }
  }
}


// ============================================================================
// 4. ADMIN REJECTS TEACHER
// ============================================================================

REQUEST:
POST /api/teacher-requests/reject/605c72ef1a1234567890abcd
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "rejectionReason": "Qualifications do not meet minimum requirements"
}

RESPONSE:
{
  "success": true,
  "message": "Teacher request rejected",
  "data": {
    "_id": "605c72ef1a1234567890abcd",
    "teacherId": "505c72ef1a1234567890aaa",
    "requestStatus": "REJECTED",
    "rejectionReason": "Qualifications do not meet minimum requirements",
    "reviewedBy": "605c72ef1a1234567890admin",
    "reviewDate": "2026-04-07T14:05:00Z"
  }
}


// ============================================================================
// 5. TEACHER CHECKS REQUEST STATUS
// ============================================================================

REQUEST:
GET /api/teacher-requests/status/505c72ef1a1234567890aaa
Authorization: Bearer <teacher_token>

RESPONSE (Pending):
{
  "success": true,
  "approvalStatus": "PENDING_APPROVAL",
  "request": {
    "_id": "605c72ef1a1234567890abcd",
    "requestStatus": "PENDING",
    "submissionDate": "2026-04-07T10:30:00Z"
  }
}

RESPONSE (Approved):
{
  "success": true,
  "approvalStatus": "APPROVED",
  "request": {
    "_id": "605c72ef1a1234567890abcd",
    "requestStatus": "APPROVED",
    "reviewDate": "2026-04-07T14:00:00Z"
  }
}


// ============================================================================
// 6. PROTECTION MIDDLEWARE - BLOCKED ACCESS
// ============================================================================

REQUEST (Teacher with PENDING status tries to access dashboard):
GET /api/dashboard
Authorization: Bearer <pending_teacher_token>

RESPONSE:
{
  "success": false,
  "message": "Your account is pending admin approval",
  "approvalStatus": "PENDING_APPROVAL"
}

RESPONSE (Rejected teacher tries to access):
{
  "success": false,
  "message": "Your account was rejected. Reason: Qualifications do not meet requirements",
  "approvalStatus": "REJECTED"
}


================================================================================
                     6. INTEGRATION CHECKLIST
================================================================================

BACKEND SETUP:
  ☐ Create/Update User schema with approval fields
  ☐ Create TeacherRequest schema
  ☐ Create teacherRequestController.js
  ☐ Create teacherRequestRoutes.js
  ☐ Update authMiddleware.js with approval checks
  ☐ Create notifications.js utility
  ☐ Create ActivityLog for audit trail
  ☐ Register routes in server.js
  ☐ Test API endpoints with Postman

FRONTEND SETUP:
  ☐ Create TeacherRequestForm.jsx component
  ☐ Create PendingApprovalsAdmin.jsx component
  ☐ Create TeacherApprovalStatus.jsx component
  ☐ Add routes in Router.jsx
  ☐ Create guards for protected pages
  ☐ Update navigation based on approval status
  ☐ Add notification system

WORKFLOW IMPLEMENTATION:
  ☐ First-time teacher redirects to request form
  ☐ Pending teachers see approval status page
  ☐ Admin dashboard shows pending approvals
  ☐ Approval sends notification to teacher
  ☐ Rejection sends notification with reason
  ☐ Approved teachers gain full access
  ☐ Audit logs track all actions

TESTING:
  ☐ Test teacher registration flow
  ☐ Test admin approval process
  ☐ Test rejection with reason
  ☐ Test pending teacher blocking
  ☐ Test rejection handling
  ☐ Test notification delivery
  ☐ Test activity log recording


================================================================================
                          7. SECURITY NOTES
================================================================================

1. PERMISSION CHECKS:
   • Only admins can view or manage teacher requests
   • Teachers cannot approve other teachers
   • Middleware blocks pending teachers from system access

2. DATA PROTECTION:
   • Use JWT tokens with expiration
   • Hash passwords with bcrypt
   • Validate all input with rate limiting
   • Log all approval actions for audit

3. NOTIFICATIONS:
   • Secure notification delivery
   • Only notify the relevant user
   • Include verification tokens if email-based
   • Log notification delivery status

4. ACTIVITY LOGGING:
   • Log all approvals and rejections
   • Record who made the decision and when
   • Store original reason for audit

5. ROLE ISOLATION:
   • Teachers initially have no role permissions
   • Assign permissions only after approval
   • Use role-based middleware guards
   • Sanitize all output data


================================================================================
                     8. ERROR HANDLING EXAMPLES
================================================================================

// Handle missing token
{
  "success": false,
  "message": "Not authorized to access this route"
}

// Handle pending approval
{
  "success": false,
  "message": "Your account is pending admin approval",
  "approvalStatus": "PENDING_APPROVAL"
}

// Handle rejected account
{
  "success": false,
  "message": "Your account was rejected. Reason: Qualifications do not meet requirements",
  "approvalStatus": "REJECTED"
}

// Handle duplicate request
{
  "success": false,
  "message": "You already have a pending or approved request"
}

// Handle invalid input
{
  "success": false,
  "message": "Please fill in all required fields"
}


================================================================================
                     9. DEPLOYMENT NOTES
================================================================================

ENVIRONMENT VARIABLES NEEDED:
  - JWT_SECRET: Secret key for JWT token signing
  - MONGODB_URI: Connection string to MongoDB
  - NODE_ENV: Set to 'production' or 'development'
  - CORS_ORIGIN: Frontend URL for CORS
  - NOTIFICATION_SERVICE: Email or SMS service endpoint

DATABASE INDEXES:
  - Create index on User.email for faster lookups
  - Create index on TeacherRequest.teacherId
  - Create index on TeacherRequest.requestStatus
  - Create index on ActivityLog.userId and .action

SCALABILITY CONSIDERATIONS:
  - Use pagination for large requests list (limit 10-20 per page)
  - Cache admin pending requests list (refresh every 5 mins)
  - Async notification delivery with queue system
  - Consider cron job for auto-approving after review period


================================================================================
                          10. TESTING EXAMPLES
================================================================================

UNIT TEST - Teacher Request Submission:
describe("TeacherRequest - Submit", () => {
  it("should create a new teacher request", async () => {
    const res = await request(app)
      .post("/api/teacher-requests/submit")
      .set("Authorization", `Bearer ${token}`)
      .send({
        qualifications: { degree: "B.A.", specialization: "Math" },
        experience: 5,
        contact: "9876543210",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.request.requestStatus).toBe("PENDING");
  });

  it("should prevent duplicate requests", async () => {
    // First request succeeds
    await submitRequest();
    
    // Second request fails
    const res = await submitRequest();
    expect(res.status).toBe(400);
    expect(res.body.message).toContain("already have");
  });
});

INTEGRATION TEST - Approval Flow:
describe("Teacher Approval Flow", () => {
  it("should block pending teacher from dashboard", async () => {
    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${pendingTeacherToken}`);

    expect(res.status).toBe(403);
    expect(res.body.approvalStatus).toBe("PENDING_APPROVAL");
  });

  it("should allow approved teacher to access dashboard", async () => {
    // Approve the teacher
    await approveTeacher();
    
    const res = await request(app)
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${approvedTeacherToken}`);

    expect(res.status).toBe(200);
  });
});


================================================================================
                            VERSION HISTORY
================================================================================

v1.0 - April 7, 2026
  - Initial implementation guide created
  - Added MongoDB schemas for User and TeacherRequest
  - Implemented complete backend API routes
  - Created React frontend components
  - Added workflow diagrams and examples
  - Included security and testing guidelines


For questions or updates, refer to the project documentation or contact
the development team.

================================================================================
