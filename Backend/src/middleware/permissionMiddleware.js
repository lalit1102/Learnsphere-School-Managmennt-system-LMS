import Role from "../models/role.js";

export const checkPermission = (permission) => async (req, res, next) => {
  const userRole = req.user?.role;
  if (!userRole) return res.status(401).json({ message: "No user role" });

  const role = await Role.findOne({ name: userRole });
  if (!role || (!role.permissions.includes(permission) && !role.permissions.includes("*"))) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
