import { createContext, useState, useEffect } from "react";
import { getTokenFromCookie } from "../utils/Utils.js";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);

  useEffect(() => {
    setToken(getTokenFromCookie());
  }, []);

  const handleSaveToken = (token) => {
    setToken(token);
  };

  const clearAuth = () => {
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, handleSaveToken, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };