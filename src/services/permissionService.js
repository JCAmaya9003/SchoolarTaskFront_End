/**
 * Permission Service
 *
 * Role-based data filtering and permission checks.
 * Enforces that teachers can only see their assigned students/grades,
 * students see only their own grades, and parents see only their children's grades.
 */

import { ROLES } from "../config/appConfig";

/**
 * Filter students based on teacher's assignments
 * Teachers can only see students in their assigned grade/section combinations
 */
export const filterStudentsForTeacher = (students, teacherData) => {
  if (!teacherData || !teacherData.assignments) {
    return [];
  }

  return students.filter((student) => {
    return teacherData.assignments.some((assignment) => {
      const gradeMatch = assignment.grade_section.grade === student.grade;
      const sectionMatch = assignment.grade_section.section === student.section;
      return gradeMatch && sectionMatch;
    });
  });
};

/**
 * Filter grades based on teacher's assigned subjects and grade/section combinations
 */
export const filterGradesForTeacher = (grades, teacherData) => {
  if (!teacherData || !teacherData.assignments) {
    return [];
  }

  return grades.filter((grade) => {
    // Support both old (studentGrade/studentSection) and new (grade/section) field names
    const gradeLevel = grade.grade || grade.studentGrade;
    const sectionLetter = grade.section || grade.studentSection;
    return teacherData.assignments.some((assignment) => {
      const gradeMatch = assignment.grade_section.grade === gradeLevel;
      const sectionMatch = assignment.grade_section.section === sectionLetter;
      const subjectMatch = assignment.subjects.includes(grade.subject);
      return gradeMatch && sectionMatch && subjectMatch;
    });
  });
};

/**
 * Filter grades for a specific student (only their own grades)
 */
export const filterGradesForStudent = (grades, studentEmail) => {
  return grades.filter((grade) => grade.studentEmail === studentEmail);
};

/**
 * Filter grades for a parent (only their children's grades)
 */
export const filterGradesForParent = (grades, parentEmail, students) => {
  // Support both parent_email (new) and email_padre (old) field names on students
  const childrenEmails = students
    .filter(
      (student) =>
        (student.parent_email || student.email_padre) === parentEmail,
    )
    .map((student) => student.email);

  return grades.filter((grade) => childrenEmails.includes(grade.studentEmail));
};

/**
 * Get children of a parent
 */
export const getChildrenForParent = (students, parentEmail) => {
  // Support both parent_email (new) and email_padre (old)
  return students.filter(
    (student) => (student.parent_email || student.email_padre) === parentEmail,
  );
};

/**
 * Check if teacher can access a specific student
 */
export const canTeacherAccessStudent = (
  teacherData,
  studentGrade,
  studentSection,
) => {
  if (!teacherData || !teacherData.assignments) {
    return false;
  }

  return teacherData.assignments.some((assignment) => {
    const gradeMatch = assignment.grade_section.grade === studentGrade;
    const sectionMatch = assignment.grade_section.section === studentSection;
    return gradeMatch && sectionMatch;
  });
};

/**
 * Check if teacher can edit a grade for a specific subject/grade/section
 */
export const canTeacherEditGrade = (teacherData, subject, grade, section) => {
  if (!teacherData || !teacherData.assignments) {
    return false;
  }

  return teacherData.assignments.some((assignment) => {
    const gradeMatch = assignment.grade_section.grade === grade;
    const sectionMatch = assignment.grade_section.section === section;
    const subjectMatch = assignment.subjects.includes(subject);
    return gradeMatch && sectionMatch && subjectMatch;
  });
};

/**
 * Get list of subjects a teacher can teach
 */
export const getTeacherSubjects = (teacherData) => {
  if (!teacherData || !teacherData.assignments) {
    return [];
  }

  const subjects = new Set();
  teacherData.assignments.forEach((assignment) => {
    assignment.subjects.forEach((subject) => subjects.add(subject));
  });

  return Array.from(subjects);
};

/**
 * Get grade/section combinations a teacher can access
 */
export const getTeacherGradeSections = (teacherData) => {
  if (!teacherData || !teacherData.assignments) {
    return [];
  }

  return teacherData.assignments.map((assignment) => ({
    grade: assignment.grade_section.grade,
    section: assignment.grade_section.section,
  }));
};

/**
 * Get subjects a teacher teaches for a specific grade/section
 */
export const getTeacherSubjectsForSection = (teacherData, grade, section) => {
  if (!teacherData || !teacherData.assignments) {
    return [];
  }

  const assignment = teacherData.assignments.find(
    (a) =>
      a.grade_section.grade === grade && a.grade_section.section === section,
  );

  return assignment ? assignment.subjects : [];
};

/**
 * Apply role-based filtering to a list of students
 */
export const applyStudentFiltering = (
  students,
  currentUser,
  currentUserData,
) => {
  if (!currentUser) return [];

  switch (currentUser.role) {
    case ROLES.ADMIN:
      return students;

    case ROLES.TEACHER:
      return filterStudentsForTeacher(students, currentUserData);

    case ROLES.STUDENT:
      return [];

    case ROLES.PARENT:
      // Support both parent_email (new) and email_padre (old)
      return students.filter(
        (s) => (s.parent_email || s.email_padre) === currentUser.email,
      );

    default:
      return [];
  }
};

/**
 * Apply role-based filtering to a list of grades
 */
export const applyGradeFiltering = (
  grades,
  currentUser,
  currentUserData,
  students = [],
) => {
  if (!currentUser) return [];

  switch (currentUser.role) {
    case ROLES.ADMIN:
      return grades;

    case ROLES.TEACHER:
      return filterGradesForTeacher(grades, currentUserData);

    case ROLES.STUDENT:
      return filterGradesForStudent(grades, currentUser.email);

    case ROLES.PARENT:
      return filterGradesForParent(grades, currentUser.email, students);

    default:
      return [];
  }
};
