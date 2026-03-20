import express from "express"
import {approveUser,getPendingUsers} from "../controllers/adminController.js"
import  adminMiddleware  from "../middleware/adminMiddleware.js"
import authMiddleware from "../middleware/authmiddleware.js"


const adminRouter = express.Router()


adminRouter.get("/users",authMiddleware, adminMiddleware, getPendingUsers)
adminRouter.post("/approve",authMiddleware, adminMiddleware, approveUser)

export default adminRouter
