import { logActivity } from "../utils/activitieslog.js";
import Exam from "../models/exam.js";
import Subject from "../models/subject.js";
import Submission from "../models/submission.js";
import { inngest } from "../inngest/index.js";

// @desc    Trigger AI Exam Generation
// @route   POST /api/exams/generate
export const triggerExamGeneration = async (req, res) => {
  try {
    const {
      title,
      subject,
      class: classId,
      duration,
      dueDate,
      topic,
      difficulty,
      count,
    } = req.body;

    const subjectDoc = await Subject.findById(subject);
    if (!subjectDoc)
      return res.status(404).json({ message: "Subject not found" });

    const teacherId = req.user._id;
    const draftExam = await Exam.create({
      title: title || `Auto-Generated: ${topic}`,
      subject,
      class: classId,
      teacher: teacherId,
      duration: duration || 60,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isActive: false,
      questions: [],
    });

    const userId = req.user._id;
    await logActivity({
      userId,
      action: `User triggered exam generation: ${draftExam._id}`,
    });

    await inngest.send({
      name: "exam/generate",
      data: {
        examId: draftExam._id,
        topic,
        subjectName: subjectDoc.name,
        difficulty: difficulty || "Medium",
        count: count || 10,
      },
    });

    res.status(202).json({
      message: "Exam generation started.",
      examId: draftExam._id,
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
};

// @desc    Create/Publish Exam
// @route   POST /api/exams
export const createExam = async (req, res) => {
  try {
    const exam = await Exam.create({
      ...req.body,
      teacher: req.user._id,
    });

    const userId = req.user._id;
    await logActivity({ userId, action: "User created a new exam" });

    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Exams (Student sees available, Teacher sees created)
// @route   GET /api/exams
export const getExams = async (req, res) => {
  try {
    const user = req.user;
    let query = {};

    if (user.role === "student") {
      query = { class: user.studentClass, isActive: true };
    } else if (user.role === "teacher") {
      query = { teacher: user._id };
    }

    const exams = await Exam.find(query)
      .populate("subject", "name")
      .populate("class", "name section")
      .select("-questions.correctAnswer");

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get exam by id
// @route   GET /api/exams/:id
export const getExamById = async (req, res) => {
  try {
    const examId = req.params.id;
    const user = req.user;

    let query = Exam.findById(examId)
      .populate("subject", "name code")
      .populate("class", "name section")
      .populate("teacher", "name email");

    if (user.role === "teacher" || user.role === "admin") {
      query = query.select("+questions.correctAnswer");
    }

    const exam = await query;

    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (user.role === "student") {
      const examClassId = exam.class._id
        ? exam.class._id.toString()
        : exam.class.toString();
      const userClassId = user.studentClass ? user.studentClass.toString() : "";

      if (examClassId !== userClassId) {
        return res
          .status(403)
          .json({ message: "You are not authorized to view this exam." });
      }
    }

    res.json(exam);
  } catch (error) {
    console.error(error);

    if (error.name === "CastError") {
      return res.status(400).json({ message: "Invalid exam ID" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};

// @desc    Toggle Exam Status (Active/Inactive)
// @route   PATCH /api/exams/:id/status
export const toggleExamStatus = async (req, res) => {
  try {
    const examId = req.params.id;
    const user = req.user;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: "Exam not found" });
    }

    if (
      user.role !== "admin" &&
      exam.teacher.toString() !== user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to modify this exam" });
    }

    exam.isActive = !exam.isActive;
    await exam.save();

    const userId = req.user._id;
    await logActivity({ userId, action: "User toggled exam status" });

    res.json({
      message: `Exam is now ${exam.isActive ? "Active" : "Inactive"}`,
      _id: exam._id,
      isActive: exam.isActive,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit & Auto-Grade Exam (handled inside Inngest)
// @route   POST /api/exams/:id/submit
export const submitExam = async (req, res) => {
  try {
    const { answers } = req.body;
    const studentId = req.user._id;
    const examId = req.params.id;

    await inngest.send({
      name: "exam/submit",
      data: { examId, studentId, answers },
    });

    const userId = req.user._id;
    await logActivity({ userId, action: "User submitted an exam" });

    res.status(201).json({
      message: "Exam submission received and is being processed.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Exam Results (Student)
// @route   GET /api/exams/:id/result
export const getExamResult = async (req, res) => {
  try {
    const studentId = req.user._id;
    const examId = req.params.id;

    const submission = await Submission.findOne({
      exam: examId,
      student: studentId,
    }).populate({
      path: "exam",
      select: "title questions._id questions.correctAnswer",
    });

    if (!submission) {
      return res.status(404).json({ message: "No submission found" });
    }

    res.json(submission);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};