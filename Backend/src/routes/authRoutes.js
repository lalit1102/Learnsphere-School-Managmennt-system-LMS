import express from "express"
import { register, login, getUserProfile, logoutUser } from "../controllers/authController.js"
import { protect } from "../middleware/authMiddleware.js"

const authrouter = express.Router()

authrouter.post("/register",register)
authrouter.post("/login",login)
authrouter.get("/me", protect, getUserProfile)
authrouter.post("/logout", logoutUser)

export default authrouter


