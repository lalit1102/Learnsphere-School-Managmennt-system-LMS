import Attendance from "../models/attendance.js";
import Class from "../models/class.js";
import { logActivity } from "../utils/activitieslog.js";

// @desc    Mark attendance for a class
// @route   POST /api/attendance/mark
// @access  Private/Admin/Teacher
export const markAttendance = async (req, res) => {
  try {
    const { classId, date, attendanceData } = req.body;

    if (!classId || !date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({ message: "Invalid attendance data" });
    }

    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    // Prepare bulk operations
    const bulkOps = attendanceData.map((item) => ({
      updateOne: {
        filter: {
          student: item.studentId,
          date: sessionDate,
          class: classId,
        },
        update: {
          $set: {
            status: item.status,
            attendance_remarks: item.remarks || "",
            remarks: item.remarks || "", // Keep for backward compatibility
            subject: item.subjectId || null, 
            markedBy: req.user._id,
          },
        },
        upsert: true,
      },
    }));

    await Attendance.bulkWrite(bulkOps);

    await logActivity({
      userId: req.user._id,
      action: `Marked attendance for class ID: ${classId} on ${sessionDate.toDateString()}`,
    });

    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Mark Attendance Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get attendance for a class and date
// @route   GET /api/attendance
// @access  Private
export const getAttendance = async (req, res) => {
  try {
    const { classId, date } = req.query;

    if (!classId || !date) {
      return res.status(400).json({ message: "Class and date are required" });
    }

    const sessionDate = new Date(date);
    sessionDate.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      class: classId,
      date: sessionDate,
    }).populate("student", "name email");

    res.json(attendanceRecords);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/:id
// @access  Private
export const getStudentAttendance = async (req, res) => {
  try {
    const studentId = req.params.id;
    const { startDate, endDate } = req.query;

    const query = { student: studentId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const history = await Attendance.find(query)
      .populate("class", "name")
      .populate("markedBy", "name")
      .populate("subject", "name")
      .sort({ date: -1 });

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
