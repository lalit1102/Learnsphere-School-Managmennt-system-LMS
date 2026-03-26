"use client";

import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import { api } from "@/lib/api";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year] = useState({ year: "2024-2025" }); // Keep as persistent mock for now

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/auth/me");
        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, year }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
