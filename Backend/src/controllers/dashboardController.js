import User from "../models/user.js";
import Class from "../models/class.js";
import Exam from "../models/exam.js";
import Submission from "../models/submission.js";
import ActivityLog from "../models/activityLog.js";
import Timetable from "../models/timetable.js";
import Attendance from "../models/attendance.js";

// Helper to get day name (e.g., "Monday")
const getTodayName = () =>
  new Date().toLocaleDateString("en-US", { weekday: "long" });

// Helper to calculate attendance percentage
const calculateAttendance = async (query = {}) => {
  const total = await Attendance.countDocuments(query);
  if (total === 0) return "0%";
  const present = await Attendance.countDocuments({ ...query, status: "present" });
  return `${((present / total) * 100).toFixed(1)}%`;
};

// Helper to find next class for a teacher/student
const getNextClass = async (role, id, classId = null) => {
  const today = getTodayName();
  const now = new Date().toLocaleTimeString("en-GB", { hour12: false, hour: '2-digit', minute: '2-digit' });
  
  const query = classId ? { class: classId } : { "schedule.periods.teacher": id };
  const timetable = await Timetable.findOne(query).populate("schedule.periods.subject", "name");
  
  if (!timetable) return null;
  
  const todaySchedule = timetable.schedule.find(s => s.day === today);
  if (!todaySchedule) return null;
  
  const nextPeriod = todaySchedule.periods
    .filter(p => p.startTime > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
    
  if (role === "teacher" && nextPeriod && nextPeriod.teacher?.toString() !== id.toString()) {
     // If teacher is specified but doesn't match this period, filter again
     // (though the query above finds the timetable, we need the specific period for THIS teacher)
     const teacherPeriods = todaySchedule.periods.filter(p => p.teacher?.toString() === id.toString());
     return teacherPeriods.filter(p => p.startTime > now).sort((a, b) => a.startTime.localeCompare(b.startTime))[0];
  }
  
  return nextPeriod;
};

// @desc    Get Dashboard Statistics (Role Based)
// @route   GET /api/dashboard/stats
export const getDashboardStats = async (req, res) => {
  try {
    const user = req.user;
    let stats = {};

    // Get last 5 activities system-wide (Admin) or personal (Others)
    const activityQuery = user.role === "admin" ? {} : { user: user._id };
    const recentActivities = await ActivityLog.find(activityQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name");

    const formattedActivity = recentActivities.map(
      (log) =>
        `${log.user.name}: ${log.action} (${new Date(
          log.createdAt
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`
    );

    if (user.role === "admin") {
      const totalStudents = await User.countDocuments({ role: "student" });
      const totalTeachers = await User.countDocuments({ role: "teacher" });
      const activeExams = await Exam.countDocuments({ isActive: true });

      // Real Attendance Data
      const avgAttendance = await calculateAttendance();

      stats = {
        totalStudents,
        totalTeachers,
        activeExams,
        avgAttendance,
        recentActivity: formattedActivity,
      };
    } else if (user.role === "teacher") {
      const myClassesCount = await Class.countDocuments({
        classTeacher: user._id,
      });

      const myExams = await Exam.find({ teacher: user._id }).select("_id");
      const myExamIds = myExams.map((exam) => exam._id);
      const pendingGrading = await Submission.countDocuments({
        exam: { $in: myExamIds },
        score: { $in: [0, null] }, 
      });

      // Real Time-based Scheduling
      const nextPeriod = await getNextClass("teacher", user._id);
      
      stats = {
        myClassesCount,
        pendingGrading,
        nextClass: nextPeriod?.subject?.name || "No upcoming sessions",
        nextClassTime: nextPeriod?.startTime || "--:--",
        recentActivity: formattedActivity,
      };
    } else if (user.role === "student") {
      const nextExam = await Exam.findOne({
        class: user.studentClass,
        dueDate: { $gte: new Date() },
      }).sort({ dueDate: 1 });

      const pendingAssignments = await Exam.countDocuments({
        class: user.studentClass,
        isActive: true,
        dueDate: { $gte: new Date() },
      });

      // Real Personal Stats
      const myAttendance = await calculateAttendance({ student: user._id });
      const nextPeriod = await getNextClass("student", user._id, user.studentClass);

      stats = {
        myAttendance,
        pendingAssignments,
        nextClass: nextPeriod?.subject?.name || "Relax Time",
        nextClassTime: nextPeriod?.startTime || "--:--",
        nextExam: nextExam?.title || "No upcoming exams",
        nextExamDate: nextExam
          ? new Date(nextExam.dueDate).toLocaleDateString()
          : "",
        recentActivity: formattedActivity,
      };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};