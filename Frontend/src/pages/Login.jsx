import { useState, useContext } from "react"
import { useNavigate } from "react-router-dom"
import API from "@/services/api"
import AuthContext from "@/context/AuthContext"
import { Button } from "@/ui/Button"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/ui/Card"

export default function Login() {
  const { setUser } = useContext(AuthContext)
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const { data } = await API.post("/auth/login", { email, password })
      if (data.success) {
        setUser(data.user)
        navigate("/admin")
      } else {
        alert(data.message)
      }
    } catch (err) {
      console.error(err)
      alert("Server error")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input input-bordered w-full"
              required
              autoComplete="current-password"
            />
            <Button type="submit">Login</Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500 text-center">
            Enter your credentials to access the admin dashboard.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}