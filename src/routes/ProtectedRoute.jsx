import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";

const ProtectedRoute = ({ redirectPath = '/' }) => {
  const { token } = useContext(AuthContext); // Get the token from AuthContext

  // If there is no token, redirect to the login page
  if (!token) {
    return <Navigate to={redirectPath} />;
  }

  // If the user is authenticated, render the child components
  return <Outlet />;
};

export default ProtectedRoute;