import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserRole = {
  ADMIN: "admin",
  TEACHER: "teacher",
  STUDENT: "student",
  PARENT: "parent",
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.STUDENT,
    },
    isActive: { type: Boolean, default: true },
    studentClass: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    teacherSubject: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],
  },
  {
    timestamps: true,
  }
);

// hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;