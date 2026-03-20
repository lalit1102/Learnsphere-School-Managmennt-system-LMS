import { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom"; // ✅ redirect
import API from "../services/api";
import  AuthContext  from "../context/AuthContext"; // ✅ named import

export default function AdminDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ role check
  useEffect(() => {
    if (!user || user.role !== "admin") {
      alert("Admin only access");
      navigate("/login");
    }
  }, [user, navigate]);

  // ✅ fetch pending users
  const fetchPendingUsers = async () => {
    try {
      const { data } = await API.get("/admin/users");
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getUsers = async () => {
      await fetchPendingUsers();
    };
    getUsers();
  }, []);

  // ✅ approve user
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

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      {users.length === 0 ? (
        <p>No pending users</p>
      ) : (
        <table className="min-w-full bg-white rounded shadow overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Role</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-b">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2">{u.status}</td>
                <td className="px-4 py-2">
                  {u.status === "pending" && (
                    <button
                      onClick={() => approveUser(u._id)}
                      className="bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}