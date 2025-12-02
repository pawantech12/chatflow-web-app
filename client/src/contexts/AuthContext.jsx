"use client";

import axios from "axios";
import { useRouter } from "next/navigation";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({}); // logged-in user
  const [token, setToken] = useState(null); // JWT
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

  // ✅ Keep localStorage synced
  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");

    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [token, user]);

  console.log("current user fetched: ", user);

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
