// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";

// Protect routes middleware
export const protect = async (req, res, next) => {
  let token;

  // check for token in cookies
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // attach user to request
      req.user = await User.findById(decoded.userId).select("-password");

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Accepts a list of allowed roles (e.g. ['admin', 'teacher'])
 * usage: router.post('/route', protect, authorize(['admin']), controller)
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Not authorized, user not found" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }

    // user has permission to proceed
    next();
  };
};

export default protect;