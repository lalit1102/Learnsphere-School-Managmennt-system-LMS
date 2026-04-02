import mongoose from "mongoose";

const { Schema } = mongoose;

const examSchema = new Schema(
  {
    title: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    teacher: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assessmentType: { type: String, enum: ["exam", "assignment"], default: "exam" },
    duration: { type: Number, required: true }, // in minutes
    dueDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    questions: [
      {
        questionText: { type: String, required: true },
        type: { type: String, enum: ["MCQ", "SHORT_ANSWER"], default: "MCQ" },
        options: [{ type: String }], // Only for MCQ
        correctAnswer: { type: String, select: false }, // Hidden from students in default queries
        points: { type: Number, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Exam", examSchema);