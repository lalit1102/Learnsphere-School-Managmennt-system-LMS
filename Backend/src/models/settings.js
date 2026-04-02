import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    schoolName: { type: String, required: true, default: "Learnsphere Academy" },
    schoolLogo: { type: String, default: "" },
    email: { type: String, default: "admin@learnsphere.com" },
    phone: { type: String, default: "+1 (555) 000-0000" },
    address: { type: String, default: "123 Education Way, Knowledge City" },
    activeYear: { type: mongoose.Schema.Types.ObjectId, ref: "AcademicYear" },
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
