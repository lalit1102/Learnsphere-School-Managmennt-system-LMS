const mongoose = require("mongoose");
const materialSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  title: String,
  fileUrl: String,
  type: String // pdf, link, etc.
});
module.exports = mongoose.model("Material", materialSchema);
