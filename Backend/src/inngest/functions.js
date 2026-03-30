import { NonRetriableError } from "inngest";
import { inngest } from "./index.js";
import Class from "../models/class.js";
import User from "../models/user.js";
import Timetable from "../models/timeTable.js";
import Exam from "../models/exam.js";
import Submission from "../models/submission.js";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

// Generate Timetable Function
export const generateTimeTable = inngest.createFunction(
  { id: "Generate-Timetable", event: "generate/timetable" },
  async ({ event, step }) => {
    const { classId, academicYearId, settings } = event.data;

    const contextData = await step.run("fetch-class-context", async () => {
      const classData = await Class.findById(classId).populate("subjects");
      if (!classData) throw new NonRetriableError("Class not found");

      const allTeacher = await User.find({ role: "teacher" });
      const classSubjectsIds = classData.subjects.map((sub) => sub._id.toString());

      const qualifiedTeachers = allTeacher
        .filter((teacher) => {
          if (!teacher.teacherSubject) return false;
          return teacher.teacherSubject.some((subId) =>
            classSubjectsIds.includes(subId.toString())
          );
        })
        .map((tea) => ({
          id: tea._id,
          name: tea.name,
          subjects: tea.teacherSubject,
        }));

      const subjectsPayload = classData.subjects.map((sub) => ({
        id: sub._id,
        name: sub.name,
        code: sub.code,
      }));

      if (subjectsPayload.length === 0 || qualifiedTeachers.length === 0) {
        throw new NonRetriableError("No Subjects or Teachers assigned to these class");
      }

      return {
        className: classData.name,
        subjects: subjectsPayload,
        teachers: qualifiedTeachers,
      };
    });

    const aiSchedule = await step.run("generate-timetable-logic", async () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new NonRetriableError("GOOGLE_GENERATIVE_AI_API_KEY is missing");

      const allTimetables = await Timetable.find({ academicYear: academicYearId });

      const prompt = `
        You are a school scheduler. Generate a weekly timetable (Monday to Friday).

        CONTEXT:
        - Class: ${contextData.className}
        - Hours: ${settings.startTime} to ${settings.endTime} (${settings.periods} periods/day).

        RESOURCES:
        - Subjects: ${JSON.stringify(contextData.subjects)}
        - Teachers: ${JSON.stringify(contextData.teachers)}
        - Other Timetables: ${JSON.stringify(allTimetables)}

        STRICT RULES:
        1. Assign a Teacher to every Subject period.
        2. Teacher MUST have the subject ID in their list.
        3. Break Time/Free Period after every 2 periods(10 minutes), Lunch Time after 5 periods(at 12:00)(30 minutes).
        4. Avoid clashes with other classes(teacher can't be in two classes at the same time).
        5. Output strict JSON only. Schema:
           {
             "schedule": [
               {
                 "day": "Monday",
                 "periods": [
                   { "subject": "SUBJECT_ID", "teacher": "TEACHER_ID", "startTime": "HH:MM", "endTime": "HH:MM" }
                 ]
               }
             ]
           }
      `;

      const google = createGoogleGenerativeAI({ apiKey });
      const activeModel = google("gemini-3-flash-preview");

      const { text } = await generateText({ prompt, model: activeModel });
      const cleanJSON = text.replace(/```json/g, "").replace(/```/g, "");
      return JSON.parse(cleanJSON);
    });

    await step.run("save-timetable", async () => {
      await Timetable.findOneAndDelete({ class: classId, academicYear: academicYearId });
      await Timetable.create({
        class: classId,
        academicYear: academicYearId,
        schedule: aiSchedule.schedule,
      });
      return { success: true, classId };
    });

    return { message: "Timetable generated successfully" };
  }
);

// Generate Exam Function
export const generateExam = inngest.createFunction(
  { id: "Generate-Exam", event: "exam/generate" },
  async ({ event, step }) => {
    const { examId, topic, subjectName, difficulty, count } = event.data;

    const aiExam = await step.run("generate-exam-logic", async () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) throw new NonRetriableError("GOOGLE_GENERATIVE_AI_API_KEY is missing");

      const prompt = `
        You are a strict teacher. Create a JSON array of ${count} multiple-choice questions for a high school exam.

        CONTEXT:
        - Subject: ${subjectName}
        - Topic: ${topic}
        - Difficulty: ${difficulty}

        STRICT JSON SCHEMA (Array of Objects):
        [
          {
            "questionText": "Question string",
            "type": "MCQ",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "The exact string of the correct option",
            "points": 1
          }
        ]

        RULES:
        1. Output ONLY raw JSON. No Markdown.
        2. Ensure correct answer matches one of the options exactly.
      `;

      const google = createGoogleGenerativeAI({ apiKey });
      const activeModel = google("gemini-3-flash-preview");
      const { text } = await generateText({ prompt, model: activeModel });

      const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleanJson);
    });

    await step.run("save-exam", async () => {
      const exam = await Exam.findById(examId);
      if (!exam) throw new NonRetriableError(`Exam ${examId} not found`);

      exam.questions = aiExam;
      exam.isActive = false;
      await exam.save();

      return { success: true, count: aiExam.length };
    });

    return { message: "Exam generated successfully" };
  }
);

// Handle Exam Submission
export const handleExamSubmission = inngest.createFunction(
  { id: "Handle-Exam-Submission", event: "exam/submit" },
  async ({ event, step }) => {
    const { examId, studentId, answers } = event.data;

    await step.run("process-exam-submission", async () => {
      const existingSubmission = await Submission.findOne({ exam: examId, student: studentId });
      if (existingSubmission) throw new NonRetriableError("Exam already submitted");

      const exam = await Exam.findById(examId).select("+questions.correctAnswer");
      if (!exam) throw new NonRetriableError(`Exam ${examId} not found`);

      let score = 0;
      let totalPoints = 0;

      exam.questions.forEach((question) => {
        totalPoints += question.points;
        const studentAns = answers.find((a) => a.questionId === question._id.toString());
        if (studentAns && studentAns.answer === question.correctAnswer) {
          score += question.points;
        }
      });

      await Submission.create({ exam: examId, student: studentId, answers, score });
    });

    return { message: "Exam submitted successfully" };
  }
);