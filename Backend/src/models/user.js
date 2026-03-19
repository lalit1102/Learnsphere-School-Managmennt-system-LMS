import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name:{type:String,required:true},
  email:{type:String,required:true,unique:true,lowercase:true},
  password:{type:String,required:true},
  role:{
    type:String,
    enum: ["admin", "teacher", "student", "parent"],
    required:true,
    default:"student"
  },
  status:{
    type:String,
    enum:["pending","approved"],
    default:"pending"
  }

},{ timestamps:true})

const User = mongoose.model("User",userSchema)

export default User