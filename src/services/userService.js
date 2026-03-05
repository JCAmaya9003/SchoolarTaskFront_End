/**
 * User Service
 *
 * Dual-mode user management for Students, Teachers, and Parents.
 * Includes permission-based filtering for role-based access control.
 */

import { APP_CONFIG, STORAGE_KEYS } from "../config/appConfig";
import * as storageService from "./storageService";
import * as permissionService from "./permissionService";
import * as authService from "./authService";

// ==================== STUDENTS ====================

/**
 * Get all students (with permission filtering)
 *
 * @param {Object} currentUser - Current logged-in user
 * @returns {Promise<Array>} Array of students (filtered by permissions)
 */
export const getStudents = async (currentUser = null) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/students`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const students = await response.json();
      
      // Apply permission filtering
      const user = currentUser || authService.getCurrentUser();
      if (user && user.role === 'teacher') {
        return permissionService.filterStudentsForTeacher(students, user);
      }
      
      return students;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

    // Apply permission-based filtering
    const user = currentUser || authService.getCurrentUser();
    if (!user) return students;

    return permissionService.applyStudentFiltering(students, user, user);
  }
};

/**
 * Create a new student
 *
 * @param {Object} studentData - Student data
 * @returns {Promise<Object>} Created student
 */
export const createStudent = async (studentData) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create student');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

    // Check if email already exists
    if (students.some((s) => s.email === studentData.email)) {
      throw new Error("A student with this email already exists");
    }

    students.push(studentData);
    storageService.setItem(STORAGE_KEYS.STUDENTS, students);

    // Also add to users list
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    users.push({
      email: studentData.email,
      password: studentData.password,
      role: "student",
      nombre: studentData.nombre,
      apellido: studentData.apellido,
    });
    storageService.setItem(STORAGE_KEYS.USERS, users);

    return studentData;
  }
};

/**
 * Update a student
 *
 * @param {string} email - Student email (identifier)
 * @param {Object} updatedData - Updated student data
 * @returns {Promise<Object>} Updated student
 */
export const updateStudent = async (email, updatedData) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/students`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedData, email }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update student');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

    const studentIndex = students.findIndex((s) => s.email === email);
    if (studentIndex === -1) {
      throw new Error("Student not found");
    }

    students[studentIndex] = { ...students[studentIndex], ...updatedData };
    storageService.setItem(STORAGE_KEYS.STUDENTS, students);

    // Update in users list too
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    const userIndex = users.findIndex((u) => u.email === email);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        nombre: updatedData.nombre,
        apellido: updatedData.apellido,
      };
      storageService.setItem(STORAGE_KEYS.USERS, users);
    }

    return students[studentIndex];
  }
};

/**
 * Delete a student
 *
 * @param {string} email - Student email
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteStudent = async (email) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/students`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete student');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
    const filteredStudents = students.filter((s) => s.email !== email);

    if (filteredStudents.length === students.length) {
      throw new Error("Student not found");
    }

    storageService.setItem(STORAGE_KEYS.STUDENTS, filteredStudents);

    // Remove from users list
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    const filteredUsers = users.filter((u) => u.email !== email);
    storageService.setItem(STORAGE_KEYS.USERS, filteredUsers);

    return { message: "Student deleted successfully" };
  }
};

// ==================== TEACHERS ====================

/**
 * Get all teachers
 *
 * @returns {Promise<Array>} Array of teachers
 */
export const getTeachers = async () => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/teachers`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    return storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
  }
};

/**
 * Create a new teacher
 *
 * @param {Object} teacherData - Teacher data (includes asignaciones)
 * @returns {Promise<Object>} Created teacher
 */
export const createTeacher = async (teacherData) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create teacher');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating teacher:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];

    if (teachers.some((t) => t.email === teacherData.email)) {
      throw new Error("A teacher with this email already exists");
    }

    teachers.push(teacherData);
    storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);

    // Add to users list
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    users.push({
      email: teacherData.email,
      password: teacherData.password,
      role: "teacher",
      nombre: teacherData.nombre,
      apellido: teacherData.apellido,
    });
    storageService.setItem(STORAGE_KEYS.USERS, users);

    return teacherData;
  }
};

/**
 * Update a teacher
 *
 * @param {string} email - Teacher email (identifier)
 * @param {Object} updatedData - Updated teacher data
 * @returns {Promise<Object>} Updated teacher
 */
export const updateTeacher = async (email, updatedData) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/teachers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedData, email }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update teacher');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];

    const teacherIndex = teachers.findIndex((t) => t.email === email);
    if (teacherIndex === -1) {
      throw new Error("Teacher not found");
    }

    teachers[teacherIndex] = { ...teachers[teacherIndex], ...updatedData };
    storageService.setItem(STORAGE_KEYS.TEACHERS, teachers);

    // Update in users list
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    const userIndex = users.findIndex((u) => u.email === email);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        nombre: updatedData.nombre,
        apellido: updatedData.apellido,
      };
      storageService.setItem(STORAGE_KEYS.USERS, users);
    }

    return teachers[teacherIndex];
  }
};

/**
 * Delete a teacher
 *
 * @param {string} email - Teacher email
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteTeacher = async (email) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/teachers`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete teacher');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
    const filteredTeachers = teachers.filter((t) => t.email !== email);

    if (filteredTeachers.length === teachers.length) {
      throw new Error("Teacher not found");
    }

    storageService.setItem(STORAGE_KEYS.TEACHERS, filteredTeachers);

    // Remove from users list
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    const filteredUsers = users.filter((u) => u.email !== email);
    storageService.setItem(STORAGE_KEYS.USERS, filteredUsers);

    return { message: "Teacher deleted successfully" };
  }
};

// ==================== PARENTS ====================

/**
 * Get all parents
 *
 * @returns {Promise<Array>} Array of parents
 */
export const getParents = async () => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/parents`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch parents');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching parents:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    return storageService.getItem(STORAGE_KEYS.PARENTS) || [];
  }
};

/**
 * Create a new parent
 *
 * @param {Object} parentData - Parent data
 * @returns {Promise<Object>} Created parent
 */
export const createParent = async (parentData) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/parents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parentData),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create parent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating parent:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const parents = storageService.getItem(STORAGE_KEYS.PARENTS) || [];

    if (parents.some((p) => p.email === parentData.email)) {
      throw new Error("A parent with this email already exists");
    }

    parents.push(parentData);
    storageService.setItem(STORAGE_KEYS.PARENTS, parents);

    // Add to users list
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    users.push({
      email: parentData.email,
      password: parentData.password,
      role: "parent",
      nombre: parentData.nombre,
      apellido: parentData.apellido,
    });
    storageService.setItem(STORAGE_KEYS.USERS, users);

    return parentData;
  }
};

/**
 * Update a parent
 *
 * @param {string} email - Parent email (identifier)
 * @param {Object} updatedData - Updated parent data
 * @returns {Promise<Object>} Updated parent
 */
export const updateParent = async (email, updatedData) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/parents`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updatedData, email }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update parent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating parent:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const parents = storageService.getItem(STORAGE_KEYS.PARENTS) || [];

    const parentIndex = parents.findIndex((p) => p.email === email);
    if (parentIndex === -1) {
      throw new Error("Parent not found");
    }

    parents[parentIndex] = { ...parents[parentIndex], ...updatedData };
    storageService.setItem(STORAGE_KEYS.PARENTS, parents);

    // Update in users list
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    const userIndex = users.findIndex((u) => u.email === email);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        nombre: updatedData.nombre,
        apellido: updatedData.apellido,
      };
      storageService.setItem(STORAGE_KEYS.USERS, users);
    }

    return parents[parentIndex];
  }
};

/**
 * Delete a parent
 *
 * @param {string} email - Parent email
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteParent = async (email) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/parents`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete parent');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting parent:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false."
    );
  } else {
    // LOCALSTORAGE MODE
    const parents = storageService.getItem(STORAGE_KEYS.PARENTS) || [];
    const filteredParents = parents.filter((p) => p.email !== email);

    if (filteredParents.length === parents.length) {
      throw new Error("Parent not found");
    }

    storageService.setItem(STORAGE_KEYS.PARENTS, filteredParents);

    // Remove from users list
    const users = storageService.getItem(STORAGE_KEYS.USERS) || [];
    const filteredUsers = users.filter((u) => u.email !== email);
    storageService.setItem(STORAGE_KEYS.USERS, filteredUsers);

    return { message: "Parent deleted successfully" };
  }
};
