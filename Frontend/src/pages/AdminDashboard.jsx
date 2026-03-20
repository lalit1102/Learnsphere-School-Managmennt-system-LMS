import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import AuthContext from "../context/AuthContext";

// Shadcn UI
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/ui/Card"
import { Button } from "@/ui/Button"
import { Avatar, AvatarImage, AvatarFallback } from "@/ui/Avatar"
import { Skeleton } from "@/ui/Skeleton"

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role check
  useEffect(() => {
    if (!user || user.role !== "admin") {
      alert("Admin only access");
      navigate("/login");
    }
  }, [user, navigate]);

  // Fetch pending users
  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/admin/users");
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  // Approve user
  const approveUser = async (userId) => {
    try {
      const { data } = await API.post("/admin/approve", { userId });
      if (data.success) {
        alert(data.message);
        fetchPendingUsers(); // refresh list
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Server error");
    }
  };

  if (loading)
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded" />
        ))}
      </div>
    );

  return (
    <div className="min-h-screen p-8 space-y-6 bg-background text-foreground">
      {/* Greeting Card */}
      <Card>
        <CardHeader>
          <CardTitle>Hello, {user?.name}</CardTitle>
          <CardDescription>Welcome back to your Admin Dashboard</CardDescription>
        </CardHeader>
      </Card>

      {/* Pending Users */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Users</CardTitle>
          <CardDescription>Approve new registrations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.length === 0 ? (
            <p>No pending users</p>
          ) : (
            users.map((u) => (
              <div
                key={u._id}
                className="flex items-center justify-between p-4 bg-card rounded shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>{u.name[0]}</Avatar>
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{u.role}</span>
                  {u.status === "pending" && (
                    <Button
                      onClick={() => approveUser(u._id)}
                      className="bg-green-500 text-white"
                    >
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}