import { logActivity } from "../utils/activitieslog.js";
import { inngest } from "../inngest/client.js";
import Timetable from "../models/timetable.js";
import Class from "../models/class.js";
import User from "../models/user.js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

/**
 * Mock Schedule Generator: Fallback for development if AI is unavailable.
 */
const generateMockSchedule = (subjects, teachers) => {
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periodsPerDay = 6;
  const startTime = "08:30";
  const duration = 45; // min
  const breakAfter = 2;
  const breakDuration = 15;

  const schedule = DAYS.map(day => {
    let currentMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const periods = [];

    for (let i = 0; i < periodsPerDay; i++) {
      const subjectIndex = (i + DAYS.indexOf(day)) % subjects.length;
      const subject = subjects[subjectIndex];
      const qualified = teachers.filter(t => t.subjects.some(s => s.toString() === subject.id.toString()));
      const teacher = qualified.length > 0 ? qualified[i % qualified.length] : teachers[0];

      if (i > 0 && i % breakAfter === 0) {
        currentMinutes += breakDuration;
      }

      const pStart = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`;
      currentMinutes += duration;
      const pEnd = `${Math.floor(currentMinutes / 60).toString().padStart(2, '0')}:${(currentMinutes % 60).toString().padStart(2, '0')}`;

      periods.push({
        subject: subject.id,
        teacher: teacher.id,
        startTime: pStart,
        endTime: pEnd
      });
    }

    return { day, periods };
  });

  return { schedule };
};

// @desc    Generate a Timetable using AI (via Inngest - async)
// @route   POST /api/timetables/generate
// @access  Private/Admin
export const generateTimetable = async (req, res) => {
  try {
    const { classId, academicYearId, settings } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Authenticated user context missing." });
    }

    // Step 1: Validate Prerequisites (Teachers & Subjects)
    const classData = await Class.findById(classId).populate("subjects");
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Filter out any subjects that failed to populate (dangling references)
    const validSubjects = (classData.subjects || []).filter(s => s !== null);
    const classSubjectsIds = validSubjects.map((s) => s._id.toString());

    const allTeachers = await User.find({ role: "teacher" });

    const qualifiedTeachers = allTeachers.filter((teacher) =>
      teacher.teacherSubject?.filter(st => st !== null).some((subId) =>
        classSubjectsIds.includes(subId.toString())
      )
    );

    if (!validSubjects.length || !qualifiedTeachers.length) {
      return res.status(400).json({
        message: "This class missing subjects or qualified teachers. Please assign them before generating a timetable.",
      });
    }

    // Step 2: Trigger Background Process
    try {
      await inngest.send({
        name: "generate/timetable",
        data: {
          classId,
          academicYearId,
          settings,
        },
      });
    } catch (ingestErr) {
      console.error("Inngest Dispatch Failure:", ingestErr);
      return res.status(500).json({ message: "Failed to dispatch background generation worker.", error: ingestErr.message });
    }

    const userId = req.user._id;
    await logActivity({
      userId,
      action: `Requested timetable generation for class ID: ${classId}`,
    });

    res.status(200).json({ message: "Timetable generation initiated" });
  } catch (error) {
    console.error("--- Generate Timetable CRASH ---");
    console.error("Stack:", error.stack);
    console.error("-------------------------------");
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Generate a Timetable using AI (Direct - synchronous, no Inngest needed)
// @route   POST /api/timetables/generate-direct
// @access  Private/Admin
export const generateTimetableDirect = async (req, res) => {
  try {
    const { classId, academicYearId, settings } = req.body;

    // Step 1: Fetch class context
    const classData = await Class.findById(classId).populate("subjects");
    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Filter out any subjects that failed to populate (dangling references)
    const validSubjects = (classData.subjects || []).filter(s => s !== null);
    const classSubjectsIds = validSubjects.map((s) => s._id.toString());

    const allTeachers = await User.find({ role: "teacher" });

    const qualifiedTeachers = allTeachers
      .filter((teacher) =>
        teacher.teacherSubject?.some((subId) =>
          classSubjectsIds.includes(subId.toString())
        )
      )
      .map((t) => ({
        id: t._id,
        name: t.name,
        subjects: t.teacherSubject,
      }));

    const subjectsPayload = validSubjects.map((s) => ({
      id: s._id,
      name: s.name,
      code: s.code,
    }));

    if (!subjectsPayload.length || !qualifiedTeachers.length) {
      return res.status(400).json({
        message: "No Subjects or qualified Teachers assigned to this class. Please assign subjects and teachers first.",
      });
    }

    // Step 2: Generate timetable via Google Gemini AI
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Google AI API key is not configured on the server." });
    }

    const safeSettings = {
      periods: settings?.periods || 5,
      startTime: settings?.startTime || "08:00",
      endTime: settings?.endTime || "14:00",
    };

    const existingTimetables = await Timetable.find({ academicYear: academicYearId });

    const google = createGoogleGenerativeAI({ apiKey });
    const model = google("gemini-2.5-flash-lite", {
        thinking: true // Enable advanced logic for clash avoidance
    });

    const prompt = `
Generate a weekly timetable (Monday to Friday).

Class: ${classData.name}
Periods per day: ${safeSettings.periods}
Time: ${safeSettings.startTime} - ${safeSettings.endTime}

Subjects: ${JSON.stringify(subjectsPayload)}
Teachers (with their subject IDs): ${JSON.stringify(qualifiedTeachers)}
Existing timetables for clash avoidance: ${JSON.stringify(existingTimetables)}

STRICT RULES:
1. CRITICAL: You MUST generate exactly ${safeSettings.periods} periods for EVERY day.
2. Assign a Teacher to every Subject period. Teacher MUST have the subject ID in their list.
3. Break Time (10 min) after every 2 periods, Lunch (30 min) around 12:00 after 4-5 periods.
4. Avoid teacher clashes with existing timetables (same teacher cannot be in two classes at same time).
5. Distribute subjects evenly across the week.
6. Output ONLY valid JSON, no markdown, no explanation.

JSON Schema:
{
  "schedule": [
    {
      "day": "Monday",
      "periods": [
        { "subject": "SUBJECT_ID", "teacher": "TEACHER_ID", "startTime": "HH:MM", "endTime": "HH:MM" }
        // ... Must contain exactly ${safeSettings.periods} items
      ]
    }
  ]
}
`;

    // Parse AI response
    let aiSchedule;
    try {
      const { text } = await generateText({ prompt, model });
      const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
      aiSchedule = JSON.parse(cleaned);
    } catch (aiErr) {
      console.error("AI Generation Failed. Reason:", aiErr.message);
      
      // Fallback: Check if the error is 403 (Forbidden/Leaked)
      if (aiErr.message.includes("403") || aiErr.message.includes("leaked") || aiErr.message.includes("not found")) {
        console.warn("⚠️  API Key is revoked or invalid. Using Mock Generation for development stability.");
        aiSchedule = generateMockSchedule(subjectsPayload, qualifiedTeachers);
        aiSchedule.isMock = true; // Mark as mock for reference
      } else {
        // Re-throw if it's something else we can't handle with a mock
        throw aiErr;
      }
    }

    // Step 3: Save timetable to DB
    await Timetable.findOneAndDelete({ class: classId, academicYear: academicYearId });

    const savedTimetable = await Timetable.create({
      class: classId,
      academicYear: academicYearId,
      schedule: aiSchedule.schedule,
    });

    // Populate for frontend display
    const populated = await Timetable.findById(savedTimetable._id)
      .populate("schedule.periods.subject", "name code")
      .populate("schedule.periods.teacher", "name email");

    // Log activity
    const userId = req.user._id;
    await logActivity({
      userId,
      action: `Generated timetable for class: ${classData.name}`,
    });

    res.status(200).json({
      message: aiSchedule.isMock ? "Generated mock schedule (API key unavailable)" : "Timetable generated successfully!",
      schedule: populated.schedule,
      isMock: aiSchedule.isMock || false
    });
  } catch (error) {
    console.error("Timetable Generation Error:", error);
    res.status(500).json({ 
      message: "Failed to generate timetable. Detailed reason: " + (error.message || "Unknown Error"),
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
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
      return res.status(200).json({ message: "Timetable not found", schedule: [] });
    }

    res.json(timetable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};