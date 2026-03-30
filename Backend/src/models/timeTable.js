import mongoose from "mongoose";

const { Schema } = mongoose;

const timetableSchema = new Schema(
  {
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    academicYear: { type: Schema.Types.ObjectId, ref: "AcademicYear", required: true },
    schedule: [
      {
        day: { type: String, required: true },
        periods: [
          {
            subject: { type: Schema.Types.ObjectId, ref: "Subject" },
            teacher: { type: Schema.Types.ObjectId, ref: "User" },
            startTime: { type: String, required: true },
            endTime: { type: String, required: true },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

// Prevent multiple timetables for the same class/year
timetableSchema.index({ class: 1, academicYear: 1 }, { unique: true });

const Timetable = mongoose.model("Timetable", timetableSchema);

export default Timetable;