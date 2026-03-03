/**
 * EvaluationAdmin (Grade Center)
 *
 * Role-based grade management hub.
 *
 * ADMIN / TEACHER:
 *   Step 1: Pick grade section (Admin sees all, Teacher sees only theirs)
 *   Step 2: Pick subject (Admin sees all for that section, Teacher sees only theirs)
 *   Step 3: Side-by-side panels:
 *     Panel A: Evaluation Plan (CRUD, % must sum to 100)
 *     Panel B: Student Grade Table (add / edit / annul / delete scores)
 *
 * PARENT:
 *   Child dropdown (oldest first) → subject cards → GradeReport
 *
 * STUDENT:
 *   Subject dashboard → select subject → GradeReport
 */

import { useState, useEffect } from "react";
import * as authService from "../services/authService";
import * as gradeService from "../services/gradeService";
import * as permissionService from "../services/permissionService";
import * as storageService from "../services/storageService";
import { STORAGE_KEYS } from "../config/appConfig";
import EvaluationPlan from "./gradeCenter/EvaluationPlan";
import StudentGradeTable from "./gradeCenter/StudentGradeTable";
import GradeReport from "./gradeCenter/GradeReport";
import "../assets/GradeCenter.css";

// ─── helpers ────────────────────────────────────────────────
const sortByAge = (a, b) => new Date(a.birth_date) - new Date(b.birth_date); // oldest first (earliest birth year)

// ────────────────────────────────────────────────────────────
const EvaluationAdmin = () => {
  const currentUser = authService.getCurrentUser();
  const role = currentUser?.role;

  // ── ADMIN / TEACHER state ──────────────────────────────
  const [gradeSections, setGradeSections] = useState([]);
  const [selectedSection, setSelectedSection] = useState(null); // { grade, section, subjects }
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [evaluations, setEvaluations] = useState([]);

  // ── PARENT state ───────────────────────────────────────
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childSubjects, setChildSubjects] = useState([]);
  const [parentSelectedSubject, setParentSelectedSubject] = useState(null);
  const [parentEvaluations, setParentEvaluations] = useState([]);
  const [parentGrades, setParentGrades] = useState([]);

  // ── STUDENT state ──────────────────────────────────────
  const [studentSubjects, setStudentSubjects] = useState([]);
  const [studentSelectedSubject, setStudentSelectedSubject] = useState(null);
  const [studentEvaluations, setStudentEvaluations] = useState([]);
  const [studentGrades, setStudentGrades] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);

  // ── Initial load by role ───────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    if (role === "admin") {
      gradeService.getGradeSections().then(setGradeSections);
    }

    if (role === "teacher") {
      const teachers = storageService.getItem(STORAGE_KEYS.TEACHERS) || [];
      const teacherData = teachers.find((t) => t.email === currentUser.email);
      if (teacherData) {
        const sections = permissionService.getTeacherGradeSections(teacherData);
        // Hydrate with subjects from grade_sections
        gradeService.getGradeSections().then((all) => {
          const myFull = sections.map(({ grade, section }) => {
            const full = all.find(
              (s) => s.grade === grade && s.section === section,
            );
            const mySubjects = permissionService.getTeacherSubjectsForSection(
              teacherData,
              grade,
              section,
            );
            return {
              grade,
              section,
              subjects: mySubjects || full?.subjects || [],
            };
          });
          setGradeSections(myFull);
        });
      }
    }

    if (role === "parent") {
      const studentsAll = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
      const myChildren = studentsAll
        .filter((s) => (s.parent_email || s.email_padre) === currentUser.email)
        .sort(sortByAge);
      setChildren(myChildren);
      if (myChildren.length > 0) selectChild(myChildren[0], myChildren);
    }

    if (role === "student") {
      const studentsAll = storageService.getItem(STORAGE_KEYS.STUDENTS) || [];
      const me = studentsAll.find((s) => s.email === currentUser.email);
      setStudentInfo(me);
      if (me) {
        gradeService.getGradeSections().then((sections) => {
          const mySection = sections.find(
            (s) => s.grade === me.grade && s.section === me.section,
          );
          setStudentSubjects(mySection?.subjects || []);
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── PARENT: select child ─────────────────────────────────
  const selectChild = async (child) => {
    setSelectedChild(child);
    setParentSelectedSubject(null);
    setParentEvaluations([]);
    setParentGrades([]);
    const sections = await gradeService.getGradeSections();
    const sec = sections.find(
      (s) => s.grade === child.grade && s.section === child.section,
    );
    setChildSubjects(sec?.subjects || []);
  };

  const selectParentSubject = async (subject) => {
    setParentSelectedSubject(subject);
    const [evs, grades] = await Promise.all([
      gradeService.getEvaluations(
        selectedChild.grade,
        selectedChild.section,
        subject,
      ),
      gradeService.getGrades(currentUser, {
        studentEmail: selectedChild.email,
      }),
    ]);
    setParentEvaluations(evs);
    setParentGrades(grades.filter((g) => g.subject === subject));
  };

  // ── STUDENT: select subject ──────────────────────────────
  const selectStudentSubject = async (subject) => {
    setStudentSelectedSubject(subject);
    const [evs, grades] = await Promise.all([
      gradeService.getEvaluations(
        studentInfo.grade,
        studentInfo.section,
        subject,
      ),
      gradeService.getGrades(currentUser, { studentEmail: currentUser.email }),
    ]);
    setStudentEvaluations(evs);
    setStudentGrades(grades.filter((g) => g.subject === subject));
  };

  // ── ADMIN/TEACHER: select section ───────────────────────
  const selectSection = (sec) => {
    setSelectedSection(sec);
    setSelectedSubject(null);
    setEvaluations([]);
    setAvailableSubjects(sec.subjects || []);
  };

  const selectSubject = async (subject) => {
    setSelectedSubject(subject);
    const evs = await gradeService.getEvaluations(
      selectedSection.grade,
      selectedSection.section,
      subject,
    );
    setEvaluations(evs);
  };

  const refreshEvaluations = async () => {
    if (selectedSection && selectedSubject) {
      const evs = await gradeService.getEvaluations(
        selectedSection.grade,
        selectedSection.section,
        selectedSubject,
      );
      setEvaluations(evs);
    }
  };

  // ── Teacher info helper ─────────────────────────────────
  const getTeacherInfo = (subject) => {
    if (!selectedSection) return null;
    return gradeService.getTeacherForSubjectSection(
      selectedSection.grade,
      selectedSection.section,
      subject,
    );
  };

  // ════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════

  if (!currentUser)
    return (
      <div className="gc-error">Please log in to access the Grade Center.</div>
    );

  // ── PARENT VIEW ─────────────────────────────────────────
  if (role === "parent") {
    return (
      <div className="gc-container">
        <div className="gc-header">
          <h2>My Children's Grades</h2>
          <div className="gc-user-info">
            Logged in as:{" "}
            <strong>
              {currentUser.firstName} {currentUser.lastName}
            </strong>
          </div>
        </div>

        {children.length === 0 && (
          <p className="gc-empty">No children linked to your account.</p>
        )}

        {children.length > 1 && (
          <div className="gc-child-selector">
            <label>Select child:</label>
            <select
              value={selectedChild?.email || ""}
              onChange={(e) => {
                const child = children.find((c) => c.email === e.target.value);
                if (child) selectChild(child);
              }}
            >
              {children.map((c) => (
                <option key={c.email} value={c.email}>
                  {c.firstName} {c.lastName} (Grade {c.grade}-{c.section})
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedChild && (
          <>
            <div className="gc-child-card">
              <div>
                <div className="gc-child-name">
                  {selectedChild.firstName} {selectedChild.lastName}
                </div>
                <div className="gc-child-detail">
                  Grade {selectedChild.grade} · Section {selectedChild.section}{" "}
                  · {selectedChild.email}
                </div>
              </div>
            </div>

            {!parentSelectedSubject ? (
              <div>
                <h3 className="gc-subtitle">
                  Select a subject to view grades:
                </h3>
                <div className="gc-subject-grid">
                  {childSubjects.map((subj) => {
                    const teacher = gradeService.getTeacherForSubjectSection(
                      selectedChild.grade,
                      selectedChild.section,
                      subj,
                    );
                    return (
                      <div
                        key={subj}
                        className="gc-subject-card"
                        onClick={() => selectParentSubject(subj)}
                      >
                        <div className="gc-subject-name">{subj}</div>
                        {teacher && (
                          <div className="gc-subject-teacher">
                            {teacher.firstName} {teacher.lastName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div>
                <div className="gc-breadcrumb">
                  <button
                    className="btn btn--back"
                    onClick={() => setParentSelectedSubject(null)}
                  >
                    Back
                  </button>
                  <span>
                    {selectedChild.firstName}'s grades {" "}
                    {parentSelectedSubject}
                  </span>
                </div>
                <GradeReport
                  evaluations={parentEvaluations}
                  grades={parentGrades}
                  subject={parentSelectedSubject}
                  studentName={`${selectedChild.firstName} ${selectedChild.lastName}`}
                />
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── STUDENT VIEW ────────────────────────────────────────
  if (role === "student") {
    return (
      <div className="gc-container">
        <div className="gc-header">
          <h2>My Grades</h2>
          {studentInfo && (
            <div className="gc-user-info">
              <strong>
                {studentInfo.firstName} {studentInfo.lastName}
              </strong>{" "}
              · Grade {studentInfo.grade}-{studentInfo.section}
              <div className="gc-user-email">{currentUser.email}</div>
            </div>
          )}
        </div>

        {!studentSelectedSubject ? (
          <div>
            <h3 className="gc-subtitle">Your subjects this year:</h3>
            <div className="gc-subject-grid">
              {studentSubjects.map((subj) => {
                const teacher = studentInfo
                  ? gradeService.getTeacherForSubjectSection(
                      studentInfo.grade,
                      studentInfo.section,
                      subj,
                    )
                  : null;
                return (
                  <div
                    key={subj}
                    className="gc-subject-card"
                    onClick={() => selectStudentSubject(subj)}
                  >
                    <div className="gc-subject-name">{subj}</div>
                    {teacher && (
                      <div className="gc-subject-teacher">
                        {teacher.firstName} {teacher.lastName}
                      </div>
                    )}
                    <div className="gc-subject-hint">
                      Click to view grades
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div>
            <div className="gc-breadcrumb">
              <button
                className="btn btn--back"
                onClick={() => setStudentSelectedSubject(null)}
              >
                My Subjects
              </button>
              <span>{studentSelectedSubject}</span>
            </div>
            <GradeReport
              evaluations={studentEvaluations}
              grades={studentGrades}
              subject={studentSelectedSubject}
            />
          </div>
        )}
      </div>
    );
  }

  // ── ADMIN / TEACHER VIEW ─────────────────────────────────
  return (
    <div className="gc-container">
      <div className="gc-header">
        <h2>{role === "admin" ? "Grade Center" : "My Grade Center"}</h2>
        <div className="gc-user-info">
          <strong>
            {currentUser.firstName} {currentUser.lastName}
          </strong>
          <span className={`gc-role-badge gc-role-badge--${role}`}>
            {role.toUpperCase()}
          </span>
          <div className="gc-user-email">{currentUser.email}</div>
        </div>
      </div>

      {/* Step 1: Select grade section */}
      {!selectedSection && (
        <div>
          <h3 className="gc-subtitle">
            {role === "admin" ? "All Grade Sections:" : "Your Grade Sections:"}
          </h3>
          {gradeSections.length === 0 && (
            <p className="gc-empty">No grade sections available.</p>
          )}
          <div className="gc-section-grid">
            {gradeSections.map((sec) => (
              <div
                key={`${sec.grade}-${sec.section}`}
                className="gc-section-card"
                onClick={() => selectSection(sec)}
              >
                <div className="gc-section-label">Grade {sec.grade}</div>
                <div className="gc-section-badge">Section {sec.section}</div>
                <div className="gc-section-count">
                  {sec.subjects?.length || 0} subjects
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Select subject */}
      {selectedSection && !selectedSubject && (
        <div>
          <div className="gc-breadcrumb">
            <button
              className="btn btn--back"
              onClick={() => {
                setSelectedSection(null);
                setAvailableSubjects([]);
              }}
            >
              Grade Sections
            </button>
            <span>
              Grade {selectedSection.grade} - Section {selectedSection.section}
            </span>
          </div>
          <h3 className="gc-subtitle">
            {role === "admin"
              ? "Subjects in this section:"
              : "Your subjects in this section:"}
          </h3>
          <div className="gc-subject-grid">
            {availableSubjects.map((subj) => {
              const teacher = getTeacherInfo(subj);
              return (
                <div
                  key={subj}
                  className="gc-subject-card"
                  onClick={() => selectSubject(subj)}
                >
                  <div className="gc-subject-name">{subj}</div>
                  {teacher && role === "admin" && (
                    <div className="gc-subject-teacher">
                      {teacher.firstName} {teacher.lastName}
                    </div>
                  )}
                  <div className="gc-subject-hint">
                    Manage evaluations & grades
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Evaluation Plan + Student Grades */}
      {selectedSection && selectedSubject && (
        <div>
          <div className="gc-breadcrumb">
            <button
              className="btn btn--back"
              onClick={() => {
                setSelectedSubject(null);
                setEvaluations([]);
              }}
            >
              Subjects
            </button>
            <span>
              Grade {selectedSection.grade}-{selectedSection.section} ·{" "}
              {selectedSubject}
            </span>
          </div>

          {(() => {
            const teacher = getTeacherInfo(selectedSubject);
            return teacher ? (
              <div className="gc-teacher-info">
                {" "}
                <strong>
                  {teacher.firstName} {teacher.lastName}
                </strong>
                <span>
                  {" "}
                  · {teacher.email} · {teacher.phone}
                </span>
              </div>
            ) : null;
          })()}

          <div className="gc-panels">
            <div className="gc-panel">
              <EvaluationPlan
                grade={selectedSection.grade}
                section={selectedSection.section}
                subject={selectedSubject}
                currentUser={currentUser}
                onUpdate={refreshEvaluations}
              />
            </div>
            <div className="gc-panel">
              <StudentGradeTable
                grade={selectedSection.grade}
                section={selectedSection.section}
                subject={selectedSubject}
                evaluations={evaluations}
                currentUser={currentUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationAdmin;
