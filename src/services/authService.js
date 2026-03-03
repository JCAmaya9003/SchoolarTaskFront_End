/**
 * Authentication Service
 *
 * Dual-mode authentication supporting both localStorage and backend API.
 * Handles login, logout, token validation, and permission checking.
 */

import { APP_CONFIG, STORAGE_KEYS, ROLES } from "../config/appConfig";
import * as storageService from "./storageService";

/**
 * Login with email and password
 * Dual-mode: Uses localStorage or backend API based on APP_CONFIG.USE_BACKEND
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data with token
 */
export const login = async (email, password) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call original API
    /* PRESERVED FOR FUTURE USE:
    const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    
    // Store token in cookie and localStorage
    document.cookie = `token=${result.token}; path=/;`;
    storageService.setItem(STORAGE_KEYS.AUTH, {
      token: result.token,
      user: result.user
    });

    return result;
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE - Use mock authentication
    return await localStorageLogin(email, password);
  }
};

/**
 * LocalStorage login implementation
 */
const localStorageLogin = async (email, password) => {
  const users = storageService.getItem(STORAGE_KEYS.USERS) || [];

  // Find user by email
  const user = users.find((u) => u.email === email);

  if (!user) {
    throw new Error("User not found");
  }

  // Validate password (in production, this would be hashed comparison)
  if (user.password !== password) {
    throw new Error("Invalid password");
  }

  // Generate mock token
  const token = `mock-token-${Date.now()}-${user.email}`;

  // Get full user data from appropriate storage
  let fullUserData = { ...user };

  // Fetch role-specific data
  if (user.role === ROLES.TEACHER) {
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
    fullUserData = teachers.find((t) => t.email === email) || user;
  } else if (user.role === ROLES.STUDENT) {
    const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
    fullUserData = students.find((s) => s.email === email) || user;
  } else if (user.role === ROLES.PARENT) {
    const parents = storageService.getItem(STORAGE_KEYS.PARENTS) || [];
    fullUserData = parents.find((p) => p.email === email) || user;
  }

  // Store authentication data
  const authData = {
    token,
    user: fullUserData,
  };

  storageService.setItem(STORAGE_KEYS.AUTH, authData);

  return {
    token,
    user: fullUserData,
    message: "Login successful",
  };
};

/**
 * Logout current user
 */
export const logout = () => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Clear cookie
    /* PRESERVED FOR FUTURE USE:
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    */
  }

  // Clear localStorage auth data (works in both modes)
  storageService.removeItem(STORAGE_KEYS.AUTH);
};

/**
 * Get current logged-in user
 *
 * @returns {Object|null} Current user or null if not logged in
 */
export const getCurrentUser = () => {
  const authData = storageService.getItem(STORAGE_KEYS.AUTH);
  return authData ? authData.user : null;
};

/**
 * Get current authentication token
 *
 * @returns {string|null} Token or null if not logged in
 */
export const getToken = () => {
  const authData = storageService.getItem(STORAGE_KEYS.AUTH);
  return authData ? authData.token : null;
};

/**
 * Check if user is authenticated
 *
 * @returns {boolean} True if user is logged in
 */
export const isAuthenticated = () => {
  if (APP_CONFIG.USE_BACKEND) {
    // In backend mode, check for valid token in cookie
    /* PRESERVED FOR FUTURE USE:
    const token = getTokenFromCookie();
    return token !== null;
    */
    return false; // Fallback to localStorage check
  }

  const authData = storageService.getItem(STORAGE_KEYS.AUTH);
  return authData !== null && authData.user !== null;
};

/**
 * Validate token
 * Dual-mode: Calls backend API or validates localStorage token
 *
 * @returns {Promise<boolean>} True if token is valid
 */
export const validateToken = async () => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call validation endpoint
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/users/validate-token`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
    */
    return isAuthenticated();
  } else {
    // LOCALSTORAGE MODE - Just check if auth data exists
    return isAuthenticated();
  }
};

/**
 * Get user role and permissions
 *
 * @returns {Promise<Object>} Role object with permission flags
 */
export const getUserRole = async () => {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Fetch from API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/users/get-role`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching role:', error);
    }
    */
  }

  // LOCALSTORAGE MODE or FALLBACK - Return role from stored user
  return {
    admin: user.role === ROLES.ADMIN,
    teacher: user.role === ROLES.TEACHER,
    parent: user.role === ROLES.PARENT,
    student: user.role === ROLES.STUDENT,
    role: user.role,
  };
};

/**
 * Get detailed user permissions (what grades/sections teacher can access)
 *
 * @returns {Object} Permissions object
 */
export const getUserPermissions = () => {
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  const permissions = {
    role: user.role,
    canManageUsers: user.role === ROLES.ADMIN,
    canManageNews: user.role === ROLES.ADMIN || user.role === ROLES.TEACHER,
    canManageGrades: user.role === ROLES.ADMIN || user.role === ROLES.TEACHER,
    canViewGrades: true, // All roles can view grades (filtered by permission)
    canManageReservations: user.role !== ROLES.STUDENT,
  };

  // Add teacher-specific permissions
  if (user.role === ROLES.TEACHER && user.assignments) {
    permissions.teacherAssignments = user.assignments;
    permissions.canTeachSubjects = [];
    permissions.canAccessGradeSections = [];

    user.assignments.forEach((assignment) => {
      permissions.canTeachSubjects.push(...assignment.subjects);
      permissions.canAccessGradeSections.push({
        grade: assignment.grade_section.grade,
        section: assignment.grade_section.section,
      });
    });

    // Remove duplicates
    permissions.canTeachSubjects = [...new Set(permissions.canTeachSubjects)];
  }

  return permissions;
};

/**
 * Check if current user can access a specific student
 *
 * @param {string} studentEmail - Student email
 * @returns {boolean} True if user has access
 */
export const canAccessStudent = (studentEmail) => {
  const user = getCurrentUser();

  if (!user) return false;

  // Admin can access all students
  if (user.role === ROLES.ADMIN) return true;

  // Students can access their own data
  if (user.role === ROLES.STUDENT && user.email === studentEmail) return true;

  // Parents can access their children
  if (user.role === ROLES.PARENT) {
    const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
    const student = students.find((s) => s.email === studentEmail);
    return (
      student && (student.parent_email || student.email_padre) === user.email
    );
  }

  // Teachers can access students in their sections
  if (user.role === ROLES.TEACHER && user.assignments) {
    const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
    const student = students.find((s) => s.email === studentEmail);

    if (!student) return false;

    return user.assignments.some((assignment) => {
      return (
        assignment.grade_section.grade === student.grade &&
        assignment.grade_section.section === student.section
      );
    });
  }

  return false;
};

/**
 * Check if current user can access specific grades
 *
 * @param {string} gradeLevel - Grade level (e.g., "5")
 * @param {string} section - Section (e.g., "A")
 * @returns {boolean} True if user has access
 */
export const canAccessGrades = (gradeLevel, section) => {
  const user = getCurrentUser();

  if (!user) return false;

  // Admin can access all grades
  if (user.role === ROLES.ADMIN) return true;

  // Teachers can access grades for their assigned sections
  if (user.role === ROLES.TEACHER && user.assignments) {
    return user.assignments.some((assignment) => {
      return (
        assignment.grade_section.grade === gradeLevel &&
        assignment.grade_section.section === section
      );
    });
  }

  // Students and parents will have filtered views, so we allow access
  // (the actual filtering happens in the services)
  return true;
};
