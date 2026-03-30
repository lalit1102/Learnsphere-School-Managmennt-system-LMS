import express from "express"
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors"
import morgan from "morgan"
import connectDB from "./src/config/db.js";


import userRoutes from "./src/routes/userRoutes.js";
import academicYearRouter from "./src/routes/academicYearRoutes.js";

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

app.use("/api/academic-years", academicYearRouter)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
