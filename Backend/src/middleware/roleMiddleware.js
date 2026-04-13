import Role from "../models/role.js";

// Only allow admin role
export const checkRole = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
  next();
};

// Check for specific permission
export const checkPermission = (permission) => async (req, res, next) => {
  const userRole = await Role.findOne({ name: req.user.role });
  if (!userRole || (!userRole.permissions.includes(permission) && !userRole.permissions.includes("*"))) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
