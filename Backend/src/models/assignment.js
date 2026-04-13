const mongoose = require("mongoose");
const assignmentSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
  fileUrl: String,
  submissions: [{ student: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, fileUrl: String, grade: String }]
});
module.exports = mongoose.model("Assignment", assignmentSchema);
