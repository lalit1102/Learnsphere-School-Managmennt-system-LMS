import User from "../models/user.js";
import TeacherRequest from "../models/teacherRequest.js";
import { generateToken } from "../utils/generateToken.js";
import { ROLE_PERMISSIONS } from "../constants/roles.js";
import { logActivity } from "../utils/activitieslog.js";

const sendApprovalNotification = async ({ email, name, status }) => {
  // TODO: Replace with real email/send notification integration.
  console.log(`Notification: ${name} <${email}> has been ${status}.`);
  return true;
};

export const requestTeacherApproval = async (req, res) => {
  try {
    const { name, email, password, contact, requestedRole, requestedPermissions } = req.body;

    if (!name || !email || !password || !requestedRole) {
      return res.status(400).json({ message: "Name, email, password and requestedRole are required." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role !== "teacher") {
        return res.status(400).json({ message: "This email is already registered with a non-teacher account." });
      }

      if (existingUser.approvalStatus === "Approved") {
        const isMatch = await existingUser.matchPassword(password);
        if (!isMatch) {
          return res.status(401).json({ message: "Invalid email or password." });
        }

        generateToken(existingUser._id.toString(), res);
        const safeUser = existingUser.toObject();
        delete safeUser.password;

        return res.json({
          message: "Login successful.",
          status: "Approved",
          user: safeUser,
        });
      }

      if (existingUser.approvalStatus === "Pending") {
        return res.status(200).json({
          message: "Your teacher account is pending approval.",
          status: "Pending",
          user: {
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
          },
        });
      }

      if (existingUser.approvalStatus === "Rejected") {
        existingUser.name = name || existingUser.name;
        existingUser.contact = contact || existingUser.contact;
        existingUser.designation = requestedRole || existingUser.designation;
        existingUser.requestedPermissions = requestedPermissions || existingUser.requestedPermissions;
        existingUser.approvalStatus = "Pending";
        existingUser.isActive = false;
        if (password) existingUser.password = password;
        await existingUser.save();

        await TeacherRequest.create({
          teacherId: existingUser._id,
          name: existingUser.name,
          email: existingUser.email,
          contact: existingUser.contact,
          requestedRole,
          requestedPermissions: requestedPermissions || [],
          status: "Pending",
        });

        return res.status(200).json({
          message: "Your teacher approval request has been resubmitted.",
          status: "Pending",
        });
      }
    }

    const newTeacher = await User.create({
      name,
      email,
      password,
      role: "teacher",
      contact: contact || "",
      isActive: false,
      approvalStatus: "Pending",
      requestedPermissions: requestedPermissions || [],
    });

    const request = await TeacherRequest.create({
      teacherId: newTeacher._id,
      name: newTeacher.name,
      email: newTeacher.email,
      contact: newTeacher.contact,
      requestedRole,
      requestedPermissions: requestedPermissions || [],
      status: "Pending",
    });

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: "Requested Teacher Approval",
        details: `Teacher approval requested for ${email}`,
      });
    }

    return res.status(200).json({
      message: "Teacher approval request submitted.",
      status: "Pending",
      requestId: request._id,
    });
  } catch (error) {
    console.error("Teacher request error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getPendingTeacherRequests = async (req, res) => {
  try {
    const requests = await TeacherRequest.find({ status: "Pending" })
      .populate("teacherId", "name email contact approvalStatus")
      .sort({ requestedAt: -1 });

    return res.json({ requests });
  } catch (error) {
    console.error("Fetch pending teacher requests error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const reviewTeacherRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, reviewNotes } = req.body;

    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be Approved or Rejected." });
    }

    const request = await TeacherRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: "Teacher request not found." });
    }

    if (request.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be reviewed." });
    }

    const user = await User.findById(request.teacherId) || await User.findOne({ email: request.email });
    if (!user) {
      return res.status(404).json({ message: "Teacher account not found for this request." });
    }

    request.status = status;
    request.reviewNotes = reviewNotes || request.reviewNotes;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();

    if (status === "Approved") {
      user.role = "teacher";
      user.designation = request.requestedRole || user.designation;
      user.isActive = true;
      user.approvalStatus = "Approved";
      user.contact = request.contact || user.contact;
      user.requestedPermissions = request.requestedPermissions || user.requestedPermissions;
      await user.save();
    } else if (status === "Rejected") {
      user.isActive = false;
      user.approvalStatus = "Rejected";
      await user.save();
    }

    await request.save();
    await sendApprovalNotification({ email: user.email, name: user.name, status });
    request.notificationSent = true;
    await request.save();

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: `Reviewed Teacher Request: ${status}`,
        details: `${req.user.name} ${status.toLowerCase()} teacher request for ${user.email}`,
      });
    }

    return res.json({
      requestId: request._id,
      status: request.status,
      teacherId: user._id,
      message: `Teacher request ${status.toLowerCase()} successfully.`,
    });
  } catch (error) {
    console.error("Review teacher request error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getUserRolesAndPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).select("name email role approvalStatus contact requestedPermissions");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      userId: user._id,
      role: {
        name: user.role,
        permissions: ROLE_PERMISSIONS[user.role] || {},
      },
      approvalStatus: user.approvalStatus || "Approved",
      contact: user.contact,
      requestedPermissions: user.requestedPermissions || [],
    });
  } catch (error) {
    console.error("Fetch user roles error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
