"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";
import { useSocket } from "@/contexts/socketContext";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // logged-in user
  const [token, setToken] = useState(null); // JWT
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const socket = useSocket(); // ✅ Listen for live status updates

  // ✅ Load token & fetch current user on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem("token");
        if (!savedToken) {
          setLoading(false);
          return;
        }

        setToken(savedToken);

        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
          { headers: { Authorization: `Bearer ${savedToken}` } }
        );

        setUser(res.data);
      } catch (err) {
        console.error("Auth initialization failed:", err);
        setUser(null);
        setToken(null);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // ✅ Live sync user status via socket
  useEffect(() => {
    if (!socket || !user) return;

    const handleStatusUpdate = ({ userId, status }) => {
      if (userId === user._id) {
        setUser((prev) => (prev ? { ...prev, status } : prev));
      }
    };

    socket.on("userStatusUpdate", handleStatusUpdate);

    return () => {
      socket.off("userStatusUpdate", handleStatusUpdate);
    };
  }, [socket, user]);

  // ✅ Keep localStorage synced
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [token, user]);

  // ✅ Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        setUser,
        setToken,
        logout,
        loading,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
