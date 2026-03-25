"use client";

import { useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        // Mock user data (replace with API later)
        const mockUser = { id: 1, name: "Test User", role: "admin" };
        setUser(mockUser);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchYear = async () => {
      try {
        // Mock year data (replace with API later)
        const mockYear = { year: "2025-2026" };
        setYear(mockYear);
      } catch (error) {
        console.error("Year fetch failed:", error);
        setYear(null);
      }
    };

    checkAuth();
    fetchYear();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, year }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
