/**
 * Application Configuration
 *
 * Central configuration for dual-mode operation.
 * Toggle between localStorage (development) and backend API (production).
 */

export const APP_CONFIG = {
  // Toggle between localStorage and backend API
  // false = Use localStorage for development/testing
  // true = Use backend API for production
  USE_BACKEND: false,

  // Backend configuration (preserved for future use)
  BACKEND_URL: import.meta.env.VITE_BASE_URL || "http://localhost:3000",
  GOOGLE_CLIENT_ID: import.meta.env.VITE_CLIENT_ID,

  // Features that require backend
  ENABLE_GOOGLE_OAUTH: false, // Currently disabled without backend
};

/**
 * User roles enumeration
 */
export const ROLES = {
  ADMIN: "admin",
  TEACHER: "teacher",
  PARENT: "parent",
  STUDENT: "student",
};

/**
 * localStorage keys
 */
export const STORAGE_KEYS = {
  AUTH: "auth",
  USERS: "users",
  NEWS: "news",
  STUDENTS: "students",
  TEACHERS: "teachers",
  PARENTS: "parents",
  RESERVATIONS: "reservations",
  GRADES: "grades",
  EVALUATIONS: "evaluations",
  ACADEMIC_PLACES: "academic_places",
  GRADE_SECTIONS: "grade_sections",
  SUBJECTS: "subjects",
  RESERVATION_RESTRICTIONS: "reservation_restrictions",
};

/**
 * Grade levels (1-12)
 */
export const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

/**
 * Section letters (A-F)
 */
export const SECTIONS = ["A", "B", "C", "D", "E", "F"];

/**
 * Default subjects list
 */
export const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "English",
  "Spanish",
  "Physical Education",
  "Arts",
  "Music",
  "Computer Science",
];
