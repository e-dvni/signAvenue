/* eslint-disable react-refresh/only-export-components */
import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);     // { id, name, email, role }
  const [token, setToken] = useState(null);   // JWT string
  const [loading, setLoading] = useState(true);

  // On first load, check localStorage for token and fetch /me
  useEffect(() => {
    const storedToken = localStorage.getItem("authToken");

    if (!storedToken) {
      setLoading(false);
      return;
    }

    const fetchMe = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/v1/me", {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (res.ok) {
          const data = await res.json(); // { id, name, email, role }
          setUser(data);
          setToken(storedToken);
        } else {
          localStorage.removeItem("authToken");
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error("Error fetching /me:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("authToken", jwtToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("authToken");
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
