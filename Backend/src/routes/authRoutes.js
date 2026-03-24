import express from "express"
import { register, login, getProfile, logout } from "../controllers/authController.js"
import authMiddleware from "../middleware/authmiddleware.js"

const authrouter = express.Router()

authrouter.post("/register",register)
authrouter.post("/login",login)
authrouter.get("/me", authMiddleware, getProfile)
authrouter.post("/logout", logout)


export default authrouter


