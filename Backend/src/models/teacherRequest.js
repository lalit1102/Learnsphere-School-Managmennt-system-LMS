import mongoose from "mongoose";

const teacherRequestSchema = new mongoose.Schema(
  {
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    name: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, default: "" },
    requestedRole: { type: String, required: true },
    requestedPermissions: [{ type: String }],
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    requestedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    reviewedAt: { type: Date },
    reviewNotes: { type: String, default: "" },
    notificationSent: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const TeacherRequest = mongoose.model("TeacherRequest", teacherRequestSchema);

export default TeacherRequest;
