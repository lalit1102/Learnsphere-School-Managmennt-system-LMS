import ActivitiesLog from "../models/activityLog.js";



export const logActivity = async ({ userId, action, details }) => {
  try {
    await ActivitiesLog.create({
      user: userId,
      action,
      details,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};