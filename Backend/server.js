import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"
import morgan from "morgan"
import connectDB from "./src/config/db.js";


import userRoutes from "./src/routes/userRoutes.js";
import academicYearRouter from "./src/routes/academicYearRoutes.js";
import classRouter from "./src/routes/classRoutes.js";
import LogsRouter from "./src/routes/activitieslog.js";
import subjectRouter from "./src/routes/subjectRoutes.js";
import timetableRouter from "./src/routes/timetableRoutes.js";
import examRouter from "./src/routes/examRoutes.js";
import dashboardRouter from "./src/routes/dashboard.js";
import settingsRouter from "./src/routes/settingsRoutes.js";
import attendanceRouter from "./src/routes/attendanceRoutes.js";
import { serve } from "inngest/express";
// import { inngest } from "./src/inngest/index.js";
// import { generateTimeTable, generateExam, handleExamSubmission } from "./src/inngest/functions.js";
// import { functions } from "./src/inngest/index.js";
import { inngest } from "./src/inngest/client.js";
import { generateTimeTable, generateExam, handleExamSubmission } from "./src/inngest/functions.js";

const functions = [generateTimeTable, generateExam, handleExamSubmission];

//read env file (Configured at top)

// express app create
const app = express()

// mongodb connected
connectDB()

// middleware created

app.use(express.json())  // parse the json body

app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies
app.use(cookieParser()); // Middleware to parse cookies

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"))
}


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


app.use("/api/users", userRoutes)
app.use("/api/activities", LogsRouter);
app.use("/api/academic-years", academicYearRouter)

app.use("/api/classes", classRouter);
app.use("/api/subjects", subjectRouter);
app.use("/api/timetables", timetableRouter)
app.use("/api/exams", examRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/attendance", attendanceRouter);
// app.use(
//   "/api/inngest",
//   serve({
//     client: inngest,
//     functions: [generateTimeTable, generateExam, handleExamSubmission],
//   })
// );





console.log("🛠️ Inngest serving functions:", functions.length, "registered");

app.use("/api/inngest", serve({ client: inngest, functions }));

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
