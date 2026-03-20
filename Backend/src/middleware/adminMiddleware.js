import User from "../models/user.js";

 const adminMiddleware = async (req,res,next) => {
  try {

    ///// authMindleware created so not required userId
    // const { userId } = req.body
    // const user = await User.findById(userId)

    // if(!user) {
    //   return res.status(404).json({
    //     success:false,
    //     message:"user not found"
    //   })
    // }

    //check the user role

    if(req.user.role !== "admin"){
      return res.status(403).json({
        success:false,
        message:"admin only access"
      })
    }
    next()

  } catch (error) {
    console.log(error);
    
    return res.status(500).json({
      success:false,
      message:"server error"
    })
  }
}

export default adminMiddleware