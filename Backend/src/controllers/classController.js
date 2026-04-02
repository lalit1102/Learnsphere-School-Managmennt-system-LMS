import Class from "../models/class.js";
import { logActivity } from "../utils/activitieslog.js";

// @desc    Create a new Class
// @route   POST /api/classes
// @access  Private/Admin
export const createClass = async (req, res) => {
  try {
    const { name, academicYear, classTeacher, capacity, subjects } = req.body;

    const existingClass = await Class.findOne({ name, academicYear });
    if (existingClass) {
      return res.status(400).json({
        message:
          "Class with this name already exists for the specified academic year.",
      });
    }

    const newClass = await Class.create({
      name,
      academicYear,
      classTeacher,
      capacity,
      subjects,
    });

    await logActivity({
      userId: req.user._id,
      action: `Created new class: ${newClass.name}`,
    });

    res.status(201).json(newClass);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get All Classes
// @route   GET /api/classes
// @access  Private
export const getAllClasses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;

    const query = {};
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const [total, classes] = await Promise.all([
      Class.countDocuments(query),
      Class.find(query)
        .populate("academicYear", "name")
        .populate("classTeacher", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({
      classes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update Class
// @route   PUT /api/classes/:id
// @access  Private/Admin
export const updateClass = async (req, res) => {
  try {
    const classId = req.params.id;

    if (req.body.name && req.body.academicYear) {
      const existingClass = await Class.findOne({
        name: req.body.name,
        academicYear: req.body.academicYear,
        _id: { $ne: classId },
      });
      if (existingClass) {
        return res.status(400).json({
          message: "Class with this name already exists for the specified academic year.",
        });
      }
    }

    // Build clean update object from known fields only
    const updateData = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.academicYear !== undefined) updateData.academicYear = req.body.academicYear;
    if (req.body.capacity !== undefined) updateData.capacity = req.body.capacity;
    if (req.body.subjects !== undefined) updateData.subjects = req.body.subjects;

    // Handle classTeacher: null means unassign
    if (req.body.classTeacher === null || req.body.classTeacher === "") {
      updateData.classTeacher = null;
    } else if (req.body.classTeacher) {
      updateData.classTeacher = req.body.classTeacher;
    }

    const updatedClass = await Class.findByIdAndUpdate(classId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    await logActivity({
      userId: req.user._id,
      action: `Updated class: ${updatedClass.name}`,
    });

    res.status(200).json(updatedClass);
  } catch (error) {
    console.error("Update Class Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Delete Class
// @route   DELETE /api/classes/:id
// @access  Private/Admin
export const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);

    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    await logActivity({
      userId: req.user._id,
      action: `Deleted class: ${deletedClass.name}`,
    });

    res.json({ message: "Class removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};