/**
 * Grade Service
 *
 * Dual-mode grade management with role-based filtering.
 * Teachers see only grades for subjects/sections they teach.
 * Students see only their own grades.
 * Parents see only their children's grades.
 */

import { APP_CONFIG, STORAGE_KEYS } from "../config/appConfig";
import * as storageService from "./storageService";
import * as permissionService from "./permissionService";
import * as authService from "./authService";

/**
 * Get grades with permission filtering
 *
 * @param {Object} currentUser - Current logged-in user
 * @param {Object} filters - Optional filters { subject, grade, section, studentEmail }
 * @returns {Promise<Array>} Array of grades (filtered by permissions)
 */
export const getGrades = async (currentUser = null, filters = {}) => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = `${APP_CONFIG.BACKEND_URL}/api/grades${queryParams ? `?${queryParams}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grades');
      }

      const grades = await response.json();
      
      // Apply permission filtering
      const user = currentUser || authService.getCurrentUser();
      const students = await getStudents();
      
      return permissionService.applyGradeFiltering(grades, user, user, students);
    } catch (error) {
      console.error('Error fetching grades:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    let grades = storageService.getItem(STORAGE_KEYS.GRADES) || [];

    // Apply basic filters — support both old (studentGrade/studentSection) and new (grade/section) field names
    if (filters.subject) {
      grades = grades.filter((g) => g.subject === filters.subject);
    }
    if (filters.grade) {
      grades = grades.filter(
        (g) => (g.grade || g.studentGrade) === filters.grade,
      );
    }
    if (filters.section) {
      grades = grades.filter(
        (g) => (g.section || g.studentSection) === filters.section,
      );
    }
    if (filters.studentEmail) {
      grades = grades.filter((g) => g.studentEmail === filters.studentEmail);
    }

    // Apply permission-based filtering with full user data (teachers need assignments)
    const user = currentUser || authService.getCurrentUser();
    if (!user) return grades;

    const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];

    // For teachers, look up their full record (includes assignments)
    let currentUserData = user;
    if (user.role === "teacher") {
      const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
      currentUserData = teachers.find((t) => t.email === user.email) || user;
    }

    return permissionService.applyGradeFiltering(
      grades,
      user,
      currentUserData,
      students,
    );
  }
};

/**
 * Create a new grade
 * Permission check: Only admins and teachers can create grades
 *
 * @param {Object} gradeData - Grade data { studentEmail, subject, grade, period, teacherEmail, studentGrade, studentSection }
 * @returns {Promise<Object>} Created grade
 */
export const createGrade = async (gradeData) => {
  // Permission check
  const user = authService.getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error(
      "Permission denied: Only admins and teachers can create grades",
    );
  }

  // For teachers, verify they can teach this subject/section
  if (user.role === "teacher") {
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
    const teacherData = teachers.find((t) => t.email === user.email) || user;
    // Support both old (studentGrade/studentSection) and new (grade/section) field names
    const gradeLevel = gradeData.grade || gradeData.studentGrade;
    const sectionLetter = gradeData.section || gradeData.studentSection;
    const canEdit = permissionService.canTeacherEditGrade(
      teacherData,
      gradeData.subject,
      gradeLevel,
      sectionLetter,
    );

    if (!canEdit) {
      throw new Error(
        "Permission denied: You cannot create grades for this subject/section",
      );
    }
  }

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create grade');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating grade:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const grades = storageService.getItem(STORAGE_KEYS.GRADES) || [];

    const newGrade = {
      _id: String(Date.now()),
      ...gradeData,
      createdAt: new Date().toISOString(),
    };

    grades.push(newGrade);
    storageService.setItem(STORAGE_KEYS.GRADES, grades);

    return newGrade;
  }
};

/**
 * Update a grade
 * Permission check: Only admins and assigned teachers can update
 *
 * @param {string} id - Grade ID
 * @param {Object} updatedData - Updated grade data
 * @returns {Promise<Object>} Updated grade
 */
export const updateGrade = async (id, updatedData) => {
  // Permission check
  const user = authService.getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error(
      "Permission denied: Only admins and teachers can update grades",
    );
  }

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/grades`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updatedData }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update grade');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating grade:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const grades = storageService.getItem(STORAGE_KEYS.GRADES) || [];

    const gradeIndex = grades.findIndex((g) => g._id === id);
    if (gradeIndex === -1) {
      throw new Error("Grade not found");
    }

    const existingGrade = grades[gradeIndex];

    // For teachers, verify they can edit this grade
    if (user.role === "teacher") {
      const canEdit = permissionService.canTeacherEditGrade(
        user,
        existingGrade.subject,
        existingGrade.studentGrade,
        existingGrade.studentSection,
      );

      if (!canEdit) {
        throw new Error("Permission denied: You cannot edit this grade");
      }
    }

    grades[gradeIndex] = { ...existingGrade, ...updatedData };
    storageService.setItem(STORAGE_KEYS.GRADES, grades);

    return grades[gradeIndex];
  }
};

/**
 * Delete a grade
 * Permission check: Only admins and assigned teachers can delete
 *
 * @param {string} id - Grade ID
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteGrade = async (id) => {
  // Permission check
  const user = authService.getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error(
      "Permission denied: Only admins and teachers can delete grades",
    );
  }

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/grades`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete grade');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting grade:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const grades = storageService.getItem(STORAGE_KEYS.GRADES) || [];

    const gradeIndex = grades.findIndex((g) => g._id === id);
    if (gradeIndex === -1) {
      throw new Error("Grade not found");
    }

    const existingGrade = grades[gradeIndex];

    // For teachers, verify they can delete this grade
    if (user.role === "teacher") {
      const canEdit = permissionService.canTeacherEditGrade(
        user,
        existingGrade.subject,
        existingGrade.studentGrade,
        existingGrade.studentSection,
      );

      if (!canEdit) {
        throw new Error("Permission denied: You cannot delete this grade");
      }
    }

    const filteredGrades = grades.filter((g) => g._id !== id);
    storageService.setItem(STORAGE_KEYS.GRADES, filteredGrades);

    return { message: "Grade deleted successfully" };
  }
};

/**
 * Get all grade sections
 *
 * @returns {Promise<Array>} Array of grade sections
 */
export const getGradeSections = async () => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/gradeSections/all`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch grade sections');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching grade sections:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    return storageService.getItem(STORAGE_KEYS.GRADE_SECTIONS) || [];
  }
};

/**
 * Create a grade section
 * Permission check: Only admins can create grade sections
 *
 * @param {Object} sectionData - Section data { grade, section, subjects }
 * @returns {Promise<Object>} Created section
 */
export const createGradeSection = async (sectionData) => {
  // Permission check - Only admin can create grade sections
  const user = authService.getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Permission denied: Only admins can create grade sections");
  }

  if (!sectionData.grade || !sectionData.section) {
    throw new Error("Grade and section are required");
  }

  // Normalize section: uppercase, single letter only
  const normalizedSection = sectionData.section.trim().toUpperCase().charAt(0);

  // Normalize grade: trim whitespace
  const normalizedGrade = String(sectionData.grade).trim();

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/gradeSections/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sectionData),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create grade section');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating grade section:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const sections = storageService.getItem(STORAGE_KEYS.GRADE_SECTIONS) || [];

    // Check for duplicates (case-insensitive for both grade and section)
    const duplicate = sections.find((s) => {
      const existingGrade = String(s.grade).trim().toLowerCase();
      const existingSection = String(s.section).trim().toUpperCase();
      return (
        existingGrade === normalizedGrade.toLowerCase() &&
        existingSection === normalizedSection
      );
    });

    if (duplicate) {
      throw new Error(
        `Grade ${normalizedGrade} - Section ${normalizedSection} already exists`,
      );
    }

    const newSection = {
      grade: normalizedGrade,
      section: normalizedSection,
      subjects: sectionData.subjects || [],
    };

    sections.push(newSection);
    storageService.setItem(STORAGE_KEYS.GRADE_SECTIONS, sections);

    return newSection;
  }
};

/**
 * Delete a grade section
 * Permission check: Only admins can delete grade sections
 *
 * @param {string} grade - Grade level
 * @param {string} section - Section
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteGradeSection = async (grade, section) => {
  // Permission check - Only admin can delete grade sections
  const user = authService.getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Permission denied: Only admins can delete grade sections");
  }

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/gradeSections/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, section }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete grade section');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting grade section:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const sections = storageService.getItem(STORAGE_KEYS.GRADE_SECTIONS) || [];

    // Check if grade section is assigned to any teachers
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
    const teachersUsingSection = teachers.filter((teacher) => {
      if (!teacher.assignments || !Array.isArray(teacher.assignments)) {
        return false;
      }
      return teacher.assignments.some(
        (assignment) =>
          assignment.grade_section &&
          assignment.grade_section.grade === grade &&
          assignment.grade_section.section === section,
      );
    });

    if (teachersUsingSection.length > 0) {
      const teacherNames = teachersUsingSection
        .map((t) => `${t.firstName} ${t.lastName}`)
        .join(", ");
      throw new Error(
        `Cannot delete Grade ${grade} - Section ${section}. It is assigned to the following teacher(s): ${teacherNames}. Please edit or delete these teachers first.`,
      );
    }

    const filteredSections = sections.filter(
      (s) => !(s.grade === grade && s.section === section),
    );

    if (filteredSections.length === sections.length) {
      throw new Error(`Grade ${grade} - Section ${section} not found`);
    }

    storageService.setItem(STORAGE_KEYS.GRADE_SECTIONS, filteredSections);

    return { message: "Grade section deleted successfully" };
  }
};

/**
 * Update a grade section
 * Permission check: Only admins can update grade sections
 *
 * @param {string} grade - Grade level
 * @param {string} section - Section
 * @param {Object} updatedData - Updated data { subjects }
 * @returns {Promise<Object>} Updated section
 */
export const updateGradeSection = async (grade, section, updatedData) => {
  // Permission check - Only admin can update grade sections
  const user = authService.getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Permission denied: Only admins can update grade sections");
  }

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/gradeSections/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, section, ...updatedData }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update grade section');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating grade section:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const sections = storageService.getItem(STORAGE_KEYS.GRADE_SECTIONS) || [];

    const sectionIndex = sections.findIndex(
      (s) => s.grade === grade && s.section === section,
    );

    if (sectionIndex === -1) {
      throw new Error(`Grade ${grade} - Section ${section} not found`);
    }

    sections[sectionIndex] = { ...sections[sectionIndex], ...updatedData };
    storageService.setItem(STORAGE_KEYS.GRADE_SECTIONS, sections);

    return sections[sectionIndex];
  }
};

/**
 * Get all subjects
 *
 * @returns {Promise<Array>} Array of subjects
 */
export const getSubjects = async () => {
  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/subjects`, {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subjects');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    return storageService.getItem(STORAGE_KEYS.SUBJECTS) || [];
  }
};

/**
 * Create a new subject
 * Permission check: Only admins can create subjects
 *
 * @param {Object} subjectData - Subject data { name }
 * @returns {Promise<string>} Created subject name
 */
export const createSubject = async (subjectData) => {
  // Permission check - Only admin can create subjects
  const user = authService.getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Permission denied: Only admins can create subjects");
  }

  if (!subjectData.name || !subjectData.name.trim()) {
    throw new Error("Subject name is required");
  }

  const subjectName = subjectData.name.trim();

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/subjects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subjectName }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create subject');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating subject:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const subjects = storageService.getItem(STORAGE_KEYS.SUBJECTS) || [];

    // Check for duplicates (case-insensitive)
    const duplicate = subjects.find((s) => {
      const existingName = typeof s === "string" ? s : s.name;
      return existingName.toLowerCase() === subjectName.toLowerCase();
    });

    if (duplicate) {
      throw new Error(`Subject "${subjectName}" already exists`);
    }

    // Add new subject (as string to match seed data format)
    subjects.push(subjectName);
    storageService.setItem(STORAGE_KEYS.SUBJECTS, subjects);

    return subjectName;
  }
};

/**
 * Delete a subject
 * Permission check: Only admins can delete subjects
 *
 * @param {string} subjectName - Subject name to delete
 * @returns {Promise<Object>} Deletion confirmation
 */
export const deleteSubject = async (subjectName) => {
  // Permission check - Only admin can delete subjects
  const user = authService.getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Permission denied: Only admins can delete subjects");
  }

  if (!subjectName || !subjectName.trim()) {
    throw new Error("Subject name is required");
  }

  if (APP_CONFIG.USE_BACKEND) {
    // BACKEND MODE - Call API
    /* PRESERVED FOR FUTURE USE:
    try {
      const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/subjects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: subjectName }),
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete subject');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting subject:', error);
      throw error;
    }
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    // LOCALSTORAGE MODE
    const subjects = storageService.getItem(STORAGE_KEYS.SUBJECTS) || [];

    // Check if subject is assigned to any teachers
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
    const teachersUsingSubject = teachers.filter((teacher) => {
      if (!teacher.assignments || !Array.isArray(teacher.assignments)) {
        return false;
      }
      return teacher.assignments.some(
        (assignment) =>
          assignment.subjects && assignment.subjects.includes(subjectName),
      );
    });

    if (teachersUsingSubject.length > 0) {
      const teacherNames = teachersUsingSubject
        .map((t) => `${t.firstName} ${t.lastName}`)
        .join(", ");
      throw new Error(
        `Cannot delete subject "${subjectName}". It is assigned to the following teacher(s): ${teacherNames}. Please edit or delete these teachers first.`,
      );
    }

    // Check if subject is in any grade sections
    const gradeSections =
      storageService.getItem(STORAGE_KEYS.GRADE_SECTIONS) || [];
    const sectionsUsingSubject = gradeSections.filter(
      (section) => section.subjects && section.subjects.includes(subjectName),
    );

    if (sectionsUsingSubject.length > 0) {
      const sectionNames = sectionsUsingSubject
        .map((s) => `Grade ${s.grade}-${s.section}`)
        .join(", ");
      throw new Error(
        `Cannot delete subject "${subjectName}". It is assigned to the following grade section(s): ${sectionNames}. Please remove it from these sections first.`,
      );
    }

    // Filter out the subject (case-sensitive match)
    const filteredSubjects = subjects.filter((s) => {
      const existingName = typeof s === "string" ? s : s.name;
      return existingName !== subjectName;
    });

    if (filteredSubjects.length === subjects.length) {
      throw new Error(`Subject "${subjectName}" not found`);
    }

    storageService.setItem(STORAGE_KEYS.SUBJECTS, filteredSubjects);

    return { message: "Subject deleted successfully" };
  }
};

// ═══════════════════════════════════════════════════════════
// EVALUATIONS (Subject plan items with % weights)
// ═══════════════════════════════════════════════════════════

/**
 * Get evaluations for a specific subject + grade + section
 */
export const getEvaluations = async (grade, section, subject) => {
  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const res = await fetch(`${APP_CONFIG.BACKEND_URL}/api/evaluations?grade=${grade}&section=${section}&subject=${subject}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch evaluations');
    return res.json();
    */
    throw new Error("Backend mode not yet implemented.");
  }

  const all = storageService.getItem(STORAGE_KEYS.EVALUATIONS) || [];
  return all.filter(
    (e) => e.grade === grade && e.section === section && e.subject === subject,
  );
};

/**
 * Create an evaluation (admin or assigned teacher only).
 * Validates that the total % for this subject/grade/section does not exceed 100.
 */
export const createEvaluation = async (evalData) => {
  const user = authService.getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error(
      "Permission denied: Only admins and teachers can create evaluations",
    );
  }

  if (user.role === "teacher") {
    const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
    const teacherData = teachers.find((t) => t.email === user.email);
    const canEdit = permissionService.canTeacherEditGrade(
      teacherData,
      evalData.subject,
      evalData.grade,
      evalData.section,
    );
    if (!canEdit)
      throw new Error(
        "Permission denied: You do not teach this subject/section",
      );
  }

  if (!evalData.name || !evalData.name.trim())
    throw new Error("Evaluation name is required");
  const pct = Number(evalData.percentage);
  if (isNaN(pct) || pct <= 0 || pct > 100)
    throw new Error("Percentage must be between 1 and 100");

  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const res = await fetch(`${APP_CONFIG.BACKEND_URL}/api/evaluations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evalData), credentials: 'include' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    return res.json();
    */
    throw new Error("Backend mode not yet implemented.");
  }

  const all = storageService.getItem(STORAGE_KEYS.EVALUATIONS) || [];
  const existing = all.filter(
    (e) =>
      e.grade === evalData.grade &&
      e.section === evalData.section &&
      e.subject === evalData.subject,
  );
  const currentTotal = existing.reduce(
    (sum, e) => sum + Number(e.percentage),
    0,
  );
  if (currentTotal + pct > 100) {
    throw new Error(
      `Cannot add ${pct}%. Current total is ${currentTotal}%, which would exceed 100% (${currentTotal + pct}% total).`,
    );
  }

  const newEval = { _id: String(Date.now()), ...evalData, percentage: pct };
  all.push(newEval);
  storageService.setItem(STORAGE_KEYS.EVALUATIONS, all);
  return newEval;
};

/**
 * Update an evaluation (admin or assigned teacher only).
 * Re-validates percentage sum excluding the evaluation being updated.
 */
export const updateEvaluation = async (id, updatedData) => {
  const user = authService.getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error(
      "Permission denied: Only admins and teachers can update evaluations",
    );
  }

  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const res = await fetch(`${APP_CONFIG.BACKEND_URL}/api/evaluations/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedData), credentials: 'include' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    return res.json();
    */
    throw new Error("Backend mode not yet implemented.");
  }

  const all = storageService.getItem(STORAGE_KEYS.EVALUATIONS) || [];
  const idx = all.findIndex((e) => e._id === id);
  if (idx === -1) throw new Error("Evaluation not found");

  const original = all[idx];

  if (updatedData.percentage !== undefined) {
    const pct = Number(updatedData.percentage);
    if (isNaN(pct) || pct <= 0 || pct > 100)
      throw new Error("Percentage must be between 1 and 100");

    // Sum all OTHER evaluations for same subject/grade/section
    const others = all.filter(
      (e) =>
        e._id !== id &&
        e.grade === original.grade &&
        e.section === original.section &&
        e.subject === original.subject,
    );
    const othersTotal = others.reduce(
      (sum, e) => sum + Number(e.percentage),
      0,
    );
    if (othersTotal + pct > 100) {
      throw new Error(
        `Cannot set ${pct}%. Other evaluations total ${othersTotal}%, which would exceed 100%.`,
      );
    }
    updatedData.percentage = pct;
  }

  all[idx] = { ...original, ...updatedData };
  storageService.setItem(STORAGE_KEYS.EVALUATIONS, all);
  return all[idx];
};

/**
 * Delete an evaluation (admin or assigned teacher only).
 * Warns if student grades exist for this evaluation.
 */
export const deleteEvaluation = async (id) => {
  const user = authService.getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error(
      "Permission denied: Only admins and teachers can delete evaluations",
    );
  }

  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const res = await fetch(`${APP_CONFIG.BACKEND_URL}/api/evaluations/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    return res.json();
    */
    throw new Error("Backend mode not yet implemented.");
  }

  const all = storageService.getItem(STORAGE_KEYS.EVALUATIONS) || [];
  const idx = all.findIndex((e) => e._id === id);
  if (idx === -1) throw new Error("Evaluation not found");

  // Check if any student grades reference this evaluation
  const grades = storageService.getItem(STORAGE_KEYS.GRADES) || [];
  const linkedGrades = grades.filter(
    (g) => g.evaluationId === id && !g.annulled,
  );
  if (linkedGrades.length > 0) {
    throw new Error(
      `Cannot delete this evaluation — ${linkedGrades.length} student grade(s) are linked to it. Annul or delete those grades first.`,
    );
  }

  storageService.setItem(
    STORAGE_KEYS.EVALUATIONS,
    all.filter((e) => e._id !== id),
  );
  return { message: "Evaluation deleted successfully" };
};

// ═══════════════════════════════════════════════════════════
// STUDENT GRADES — Extended helpers
// ═══════════════════════════════════════════════════════════

/**
 * Annul (soft-delete) a student grade.
 * Grade stays in storage but marked as annulled = true.
 */
export const annulGrade = async (id) => {
  const user = authService.getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error(
      "Permission denied: Only admins and teachers can annul grades",
    );
  }

  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const res = await fetch(`${APP_CONFIG.BACKEND_URL}/api/grades/${id}/annul`, { method: 'PATCH', credentials: 'include' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    return res.json();
    */
    throw new Error("Backend mode not yet implemented.");
  }

  const grades = storageService.getItem(STORAGE_KEYS.GRADES) || [];
  const idx = grades.findIndex((g) => g._id === id);
  if (idx === -1) throw new Error("Grade not found");

  grades[idx] = { ...grades[idx], annulled: true };
  storageService.setItem(STORAGE_KEYS.GRADES, grades);
  return grades[idx];
};

/**
 * Get students enrolled in a specific grade + section
 */
export const getStudentsForSection = async (grade, section) => {
  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const res = await fetch(`${APP_CONFIG.BACKEND_URL}/api/students?grade=${grade}&section=${section}`, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch students');
    return res.json();
    */
    throw new Error("Backend mode not yet implemented.");
  }

  const students = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
  return students.filter((s) => s.grade === grade && s.section === section);
};

/**
 * Get teacher info for a given subject + grade section
 */
export const getTeacherForSubjectSection = (grade, section, subject) => {
  const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
  return (
    teachers.find(
      (t) =>
        t.assignments &&
        t.assignments.some(
          (a) =>
            a.grade_section.grade === grade &&
            a.grade_section.section === section &&
            a.subjects.includes(subject),
        ),
    ) || null
  );
};

/**
 * Restore (unannul) a previously annulled grade.
 * Only admins and teachers can unannul grades.
 */
export const unannulGrade = async (id) => {
  const user = authService.getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "teacher")) {
    throw new Error(
      "Permission denied: Only admins and teachers can restore grades",
    );
  }

  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const res = await fetch(`${APP_CONFIG.BACKEND_URL}/api/grades/${id}/unannul`, { method: 'PATCH', credentials: 'include' });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
    return res.json();
    */
    throw new Error("Backend mode not yet implemented.");
  }

  const grades = storageService.getItem(STORAGE_KEYS.GRADES) || [];
  const idx = grades.findIndex((g) => g._id === id);
  if (idx === -1) throw new Error("Grade not found");

  grades[idx] = { ...grades[idx], annulled: false };
  storageService.setItem(STORAGE_KEYS.GRADES, grades);
  return grades[idx];
};
