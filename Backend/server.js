import express from "express"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"
import connectDB from "./src/config/db.js";
import authrouter from "./src/routes/authRoutes.js";
import adminRouter from "./src/routes/adminRoutes.js";
import userRouter from "./src/routes/userRoutes.js";

//read env file
dotenv.config(); 

// express app create
const app = express()

// mongodb connected
connectDB()

// middleware created

app.use(express.json())  // parse the json body

app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.use(cookieParser()); // Middleware to parse cookies


app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
// testing to route
app.get("/", (req, res) => {
  res.send("API Working");
});

// routes
app.use("/api/auth",authrouter)
app.use("/api/admin",adminRouter)
app.use("/api/users",userRouter)

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{
  console.log(`Server running on port ${PORT}`)
})
