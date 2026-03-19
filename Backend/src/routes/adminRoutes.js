import express from "express"
import {approveUser,getPendingUsers} from "../controllers/adminController.js"


const adminRouter = express.Router()


adminRouter.get("/users",getPendingUsers)
adminRouter.post("/approve",approveUser)

export default adminRouter
