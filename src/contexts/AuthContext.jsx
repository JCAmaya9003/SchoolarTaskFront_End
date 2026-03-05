/**
 * Auth Context
 *
 * Provides authentication state and methods throughout the application.
 * Updated to use authService with dual-mode support.
 */

import { createContext, useState, useEffect } from "react";
import * as authService from "../services/authService";

/* PRESERVED FOR FUTURE USE - Original cookie-based implementation:
import { getTokenFromCookie } from "../utils/Utils.js";
*/

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          const currentToken = authService.getToken();
          const userRole = await authService.getUserRole();
          const userPermissions = authService.getUserPermissions();

          setUser(currentUser);
          setToken(currentToken);
          setRole(userRole);
          setPermissions(userPermissions);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Handle successful login
   * @param {string} token - Authentication token
   * @param {Object} userData - User data
   */
  const handleSaveToken = async (token, userData = null) => {
    setToken(token);

    if (userData) {
      setUser(userData);

      // Fetch role and permissions
      try {
        const userRole = await authService.getUserRole();
        const userPermissions = authService.getUserPermissions();

        setRole(userRole);
        setPermissions(userPermissions);
      } catch (error) {
        console.error("Error fetching role/permissions:", error);
      }
    } else {
      // If no user data provided, fetch from service
      const currentUser = authService.getCurrentUser();
      const userRole = await authService.getUserRole();
      const userPermissions = authService.getUserPermissions();

      setUser(currentUser);
      setRole(userRole);
      setPermissions(userPermissions);
    }
  };

  /**
   * Clear authentication state
   */
  const clearAuth = () => {
    /* PRESERVED FOR FUTURE USE - Cookie clearing:
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    */

    authService.logout();
    setToken(null);
    setUser(null);
    setRole(null);
    setPermissions(null);
  };

  /**
   * Check if user has a specific role
   * @param {string} roleName - Role to check ('admin', 'teacher', 'parent', 'student')
   * @returns {boolean}
   */
  const hasRole = (roleName) => {
    if (!role) return false;
    return role[roleName] === true;
  };

  /**
   * Check if user has a specific permission
   * @param {string} permissionName - Permission to check
   * @returns {boolean}
   */
  const hasPermission = (permissionName) => {
    if (!permissions) return false;
    return permissions[permissionName] === true;
  };

  const value = {
    // State
    token,
    user,
    role,
    permissions,
    isLoading,

    // Methods
    handleSaveToken,
    clearAuth,
    hasRole,
    hasPermission,

    // Computed properties
    isAuthenticated: authService.isAuthenticated(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthProvider, AuthContext };
