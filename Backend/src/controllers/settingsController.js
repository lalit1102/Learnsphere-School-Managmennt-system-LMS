import Settings from "../models/settings.js";
import { logActivity } from "../utils/activitieslog.js";

// @desc    Get current school settings
// @route   GET /api/settings
// @access  Private (Admin)
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne().populate("activeYear");

    // If no settings exist (first run), create default
    if (!settings) {
      settings = await Settings.create({});
    }

    return res.json(settings);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// @desc    Update school settings
// @route   PUT /api/settings
// @access  Private (Admin)
export const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = new Settings(req.body);
    } else {
      // Manual field mapping for better control
      settings.schoolName = req.body.schoolName || settings.schoolName;
      settings.schoolLogo = req.body.schoolLogo || settings.schoolLogo;
      settings.email = req.body.email || settings.email;
      settings.phone = req.body.phone || settings.phone;
      settings.address = req.body.address || settings.address;
      settings.activeYear = req.body.activeYear || settings.activeYear;
      settings.facebook = req.body.facebook || settings.facebook;
      settings.twitter = req.body.twitter || settings.twitter;
      settings.instagram = req.body.instagram || settings.instagram;
      settings.linkedin = req.body.linkedin || settings.linkedin;
    }

    const updatedSettings = await settings.save();

    if (req.user) {
      await logActivity({
        userId: req.user._id.toString(),
        action: "Updated School Settings",
        details: `Updated school branding and contact info for ${updatedSettings.schoolName}`,
      });
    }

    return res.json(updatedSettings);
  } catch (error) {
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
