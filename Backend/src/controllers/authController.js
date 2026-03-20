import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"

export const register = async (req, res) => {
  const { name, email, password,role} = req.body;

  try {
    // check user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "user already exist",
      });
    }

    // hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // create user
    const user = await User.create({
      name,
      email,
      password: hashPassword,
      role
    });

    // remove password
    const { password: pass, ...userData } = user._doc;

    return res.status(201).json({
      success: true,
      message: "register successfully",
      user:userData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    // check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "password mismatch",
      });
    }
    // check approval
    if (user.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: "wait for admin approval",
      });
    }

    // jwt token generate

    const token = jwt.sign(
      {id:user._id,role:user.role},
      process.env.JWT_SECRET,
      {expiresIn:"7d"}
    )

    // cookie set

    res.cookie("token",token,{
      httpOnly:true,
      secure:false,
      sameSite:"lax",
      maxAge:7*24*60*60*1000
    })

    const { password: pass, ...userData } = user._doc;
    
    // success
    return res.status(200).json({
      success: true,
      message: "user login successful",
      user : userData ,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "server error",
    });
  }
};
