import { inngest } from "./client.js";
import Class from "../models/class.js";
import User from "../models/user.js";
import Timetable from "../models/timetable.js";
import Exam from "../models/exam.js";
import Submission from "../models/submission.js";

import { NonRetriableError } from "inngest";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export const generateTimeTable = inngest.createFunction(
  { id: "Generate-Timetable", triggers: [{ event: "generate/timetable" }] },
  async ({ event, step }) => {
    const { classId, academicYearId, settings } = event.data;

    const contextData = await step.run("fetch-class-context", async () => {
      // fetch class
      const classData = await Class.findById(classId).populate("subjects");
      if (!classData) throw new NonRetriableError("Class not found");

      // Filter out dangling references
      const validSubjects = (classData.subjects || []).filter(s => s !== null);
      const classSubjectsIds = validSubjects.map((sub) =>
        sub._id.toString()
      );

      // fetch teachers
      const allTeacher = await User.find({ role: "teacher" });

      // filter qualified teachers for class subjects
      const qualifiedTeachers = allTeacher
        .filter((teacher) => {
          if (!teacher.teacherSubject) return false;
          return teacher.teacherSubject.filter(st => st !== null).some((subId) =>
            classSubjectsIds.includes(subId.toString())
          );
        })
        .map((tea) => ({
          id: tea._id,
          name: tea.name,
          subjects: tea.teacherSubject,
        }));

      const subjectsPayload = validSubjects.map((sub) => ({
        id: sub._id,
        name: sub.name,
        code: sub.code,
      }));

      // here we should check if we have teachers and subjects
      if (subjectsPayload.length === 0 || qualifiedTeachers.length === 0)
        throw new NonRetriableError(
          "No Subjects or Teachers assigned to these class. Please check class configuration."
        );

      return {
        className: classData.name,
        subjects: subjectsPayload,
        teachers: qualifiedTeachers,
      };
    });

    // generate timetable logic would go here
    const aiSchedule = await step.run("generate-timetable-logic", async () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new NonRetriableError("GOOGLE_GENERATIVE_AI_API_KEY is missing");
      }

      const allTimetables = await Timetable.find({
        academicYear: academicYearId,
      });

      const prompt = `
        You are a school scheduler. Generate a weekly timetable (Monday to Friday).

        CONTEXT:
        - Class: ${contextData.className}
        - Hours: ${settings.startTime} to ${settings.endTime} (${
        settings.periods
      } periods/day).

        RESOURCES:
        - Subjects: ${JSON.stringify(contextData.subjects)}
        - Teachers: ${JSON.stringify(contextData.teachers)}
        - Other Timetables: ${JSON.stringify(allTimetables)}

        STRICT RULES:
        1. CRITICAL: You MUST generate exactly ${settings.periods} periods for EVERY day.
        2. Assign a Teacher to every Subject period. Teacher MUST have the subject ID in their list.
        3. Break Time/Free Period after every 2 periods(10 minutes), Lunch Time after 5 periods(at 12:00)(30 minutes).
        4. Avoid clashes with other classes(teacher can't be in two classes at the same time).
        5. Output strict JSON only. Schema:
           {
             "schedule": [
               {
                 "day": "Monday",
                 "periods": [
                   { "subject": "SUBJECT_ID", "teacher": "TEACHER_ID", "startTime": "HH:MM", "endTime": "HH:MM" }
                   // ... Must contain exactly ${settings.periods} items
                 ]
               }
             ]
           }
      `;

      const google = createGoogleGenerativeAI({
        apiKey,
      });

      // Mapped to Gemini 2.5 Flash Lite as per API capability
      const activeModel = google("gemini-2.5-flash-lite", { thinking: true });

      const { text } = await generateText({
        prompt,
        model: activeModel,
      });

      const cleanJSON = text.replace(/```json/g, "").replace(/```/g, "");
      return JSON.parse(cleanJSON);
    });

    // now let save
    await step.run("save-timetable", async () => {
      // Delete existing to avoid duplicates
      await Timetable.findOneAndDelete({
        class: classId,
        academicYear: academicYearId,
      });
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

export const generateExam = inngest.createFunction(
  { id: "Generate-Exam", triggers: [{ event: "exam/generate" }] },
  async ({ event, step }) => {
    const { examId, topic, subjectName, difficulty, count } = event.data;

    const aiExam = await step.run("generate-exam-logic", async () => {
      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      if (!apiKey) {
        throw new NonRetriableError("GOOGLE_GENERATIVE_AI_API_KEY is missing");
      }

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

      const google = createGoogleGenerativeAI({
        apiKey,
      });

      const activeModel = google("gemini-2.5-flash-lite");

      const { text } = await generateText({
        prompt,
        model: activeModel,
      });

      // Sanitize JSON
      const cleanJson = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      return JSON.parse(cleanJson);
    });

    // now let save
    await step.run("save-exam", async () => {
      const exam = await Exam.findById(examId);

      if (!exam) {
        throw new NonRetriableError(`Exam ${examId} not found`);
      }

      // Update the exam with the new questions
      exam.questions = aiExam;
      exam.isActive = false; // Keep it inactive until teacher reviews it

      await exam.save();

      return { success: true, count: aiExam.length };
    });
    return { message: "Exam generated successfully" };
  }
);

// handle submission inside inngest
export const handleExamSubmission = inngest.createFunction(
  { id: "Handle-Exam-Submission", triggers: [{ event: "exam/submit" }] },
  async ({ event, step }) => {
    const { examId, studentId, answers } = event.data;

    await step.run("process-exam-submission", async () => {
      // 1. Check if already submitted
      const existingSubmission = await Submission.findOne({
        exam: examId,
        student: studentId,
      });
      if (existingSubmission) {
        throw new NonRetriableError("Exam already submitted");
      }

      // 2. Fetch full exam (with answers)
      const exam = await Exam.findById(examId).select(
        "+questions.correctAnswer"
      );
      if (!exam) {
        throw new NonRetriableError(`Exam ${examId} not found`);
      }

      // 3. Calculate Score
      let score = 0;
      let totalPoints = 0;

      exam.questions.forEach((question) => {
        totalPoints += question.points;
        const studentAns = answers.find(
          (a) => a.questionId === question._id.toString()
        );
        if (studentAns && studentAns.answer === question.correctAnswer) {
          score += question.points;
        }
      });

      // 4. Save Submission
      await Submission.create({
        exam: examId,
        student: studentId,
        answers,
        score,
      });
    });
    return { message: "Exam submitted successfully" };
  }
);
