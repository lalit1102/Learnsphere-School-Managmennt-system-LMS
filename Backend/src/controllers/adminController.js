import User from "../models/user.js";

// show all pending users

export const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({ status: "pending" }).select("-password");;

    return res.status(200).json({
      success: true,
      message: "all unapproved user find by admin",
      users,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

// user approved by admin
export const approveUser = async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
    user.status = "approved";
    await user.save();

    return res.status(200).json({
      success: true,
      message: "user approved successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};
