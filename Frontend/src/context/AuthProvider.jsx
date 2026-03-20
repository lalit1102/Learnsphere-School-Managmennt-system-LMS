import { Children, useState } from "react"
import AuthContext from "./AuthContext"
import API from "../services/api"


const AuthProvider = ({Children}) => {

  const [user,setUser] = useState(null)

  const loginUser = async (email,password) =>{
    try {
      const { data } = await API.post("/auth/login",{email,password})
      if(data.success) setUser(data.user)
        return data;
    } catch (error) {
      console.log(error);
      return {
        success:false, message:"Login Failex"
      }
      
    }
  }

  const logoutUser = () => setUser(null)

  const value = {user,loginUser,logoutUser}

  return (
    <AuthContext.Provider value={value}>
      {Children}
    </AuthContext.Provider>
  )
}

export default AuthProvider