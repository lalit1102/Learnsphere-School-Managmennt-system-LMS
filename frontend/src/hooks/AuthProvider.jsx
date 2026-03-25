"use client";

import { createContext, useState, useEffect, useContext } from "react";
import { api } from "@/lib/api";

// 1. Create Context
const AuthContext = createContext({
  user: null,
  setUser: () => {},
  loading: true,
  year: null,
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // prevent flicker
  const [year, setYear] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/users/profile");
        setUser(data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    const fetchYear = async () => {
      try {
        const { data } = await api.get("/academic-years/current");
        setYear(data);
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

// 2. Custom hook
export const useAuth = () => useContext(AuthContext);
