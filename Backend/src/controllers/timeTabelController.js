import { logActivity } from "../utils/activitieslog.js";
import { inngest } from "../inngest/index.js";
import Timetable from "../models/timeTable.js";

// @desc    Generate a Timetable using AI
// @route   POST /api/timetables/generate
// @access  Private/Admin
export const generateTimetable = async (req, res) => {
  try {
    const { classId, academicYearId, settings } = req.body;

    await inngest.send({
      name: "generate/timetable",
      data: {
        classId,
        academicYearId,
        settings,
      },
    });

    const userId = req.user._id; // assuming req.user is set by auth middleware
    await logActivity({
      userId,
      action: `Requested timetable generation for class ID: ${classId}`,
    });

    res.status(200).json({ message: "Timetable generation initiated" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Get Timetable by Class
// @route   GET /api/timetables/:classId
export const getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ class: req.params.classId })
      .populate("schedule.periods.subject", "name code")
      .populate("schedule.periods.teacher", "name email");

    if (!timetable) {
      return res.status(404).json({ message: "Timetable not found" });
    }

    res.json(timetable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};