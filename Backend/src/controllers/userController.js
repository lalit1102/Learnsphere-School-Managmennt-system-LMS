import User from "../models/user.js";
import { generateToken } from "../utils/generateToken.js";
import { logActivity } from "../utils/activitieslog.js";

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Private (Admin & Teacher)



export const register = async (req, res) => {
  console.log("REGISTER HIT");
  try {
    const {
      name,
      email,
      password,
      role,
      studentClass,
      teacherSubject,
      isActive,
    } = req.body;
    console.log("REGISTRATION PAYLOAD:", req.body);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: `Registration failed: Email ${email} is already in use.` });
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      studentClass,
      teacherSubject,
      isActive,
    });

    if (newUser) {
      if (req.user) {
        await logActivity({
          userId: req.user._id.toString(),
          action: "Registered User",
          details: `Registered user with email: ${newUser.email}`,
        });
      }

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
        studentClass: newUser.studentClass,
        teacherSubject: newUser.teacherSubject,
        message: "User registered successfully",
      });
    }

    return res.status(400).json({ message: "Registration failed: Invalid user data provided." });
  } catch (error) {
    console.error("REGISTRATION ERROR DETAILS:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Validation Error", details: error.errors });
    }
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};







// @desc    Login user & get token
// @route   POST /api/users/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      generateToken(user._id.toString(), res);

      // Do not return the hashed password
      return res.json(user);
    }

    return res.status(401).json({ message: "Invalid email or password" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update user details
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.isActive =
      req.body.isActive !== undefined ? req.body.isActive : user.isActive;
    user.studentClass = req.body.studentClass || user.studentClass;
    user.teacherSubject = req.body.teacherSubject || user.teacherSubject;

    if (req.body.password) {
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: "Updated User",
        details: `Updated user with email: ${updatedUser.email}`,
      });
    }

    return res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      studentClass: updatedUser.studentClass,
      teacherSubject: updatedUser.teacherSubject,
      message: "User updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get all users (Pagination + Search + Filter)
// @route   GET /api/users
// @access  Private (Admin)
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const role = req.query.role;
    const search = req.query.search;
    const classId = req.query.classId;

    const skip = (page - 1) * limit;
    const filter = {};

    if (role && role !== "all" && role !== "") {
      filter.role = role;
    }

    if (classId) {
      filter.studentClass = classId;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [total, users] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .select("-password")
        .populate("teacherSubject", "name")
        .populate("studentClass", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return res.json({
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: "Deleted User",
        details: `Deleted user with email: ${user.email}`,
      });
    }

    return res.json({ message: "User deleted successfully" });
  }
  catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get logged-in user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    return res.json({
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Public
export const logoutUser = async (req, res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0),
    });

    return res.json({ message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};