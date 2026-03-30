import mongoose from "mongoose";

const academicYearSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fromYear: { type: Date, required: true },
    toYear: { type: Date, required: true },
    isCurrent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const AcademicYear = mongoose.model("AcademicYear", academicYearSchema);

export default AcademicYear;