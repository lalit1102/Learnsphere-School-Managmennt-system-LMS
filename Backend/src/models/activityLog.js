import mongoose from "mongoose";

const activitiesLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User", 
    },
    action: {
      type: String,
      required: true,
    },
    details: {
      type: String,
    }
  },
  {
    timestamps: true, 
  }
);

const ActivitiesLog = mongoose.model("ActivitiesLog", activitiesLogSchema);

export default ActivitiesLog;