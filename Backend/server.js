import express from "express"
import dotenv from "dotenv";

//read env file
dotenv.config(); 

// express app create
const app = express()

// middleware created

app.use(express.json())  // parse the json body

// testing to route
app.get("/", (req, res) => {
  res.send("API Working");
});

const PORT = process.env.PORT || 5000
app.listen(PORT,()=>{
  console.log(`Server running on port ${PORT}`)
})
