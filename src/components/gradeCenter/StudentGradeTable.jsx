/**
 * StudentGradeTable Component
 *
 * Panel B for Admin/Teacher: grid of students × evaluations.
 * Allows adding, editing, and annulling a score per student per evaluation.
 */

import { useState, useEffect, useMemo } from "react";
import * as gradeService from "../../services/gradeService";

const StudentGradeTable = ({
  grade,
  section,
  subject,
  evaluations,
  currentUser,
}) => {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { studentEmail, evaluationId }
  const [editScore, setEditScore] = useState("");
  const [error, setError] = useState("");

  // ── Filters ──────────────────────────────────────────────
  const [filterFirst, setFilterFirst] = useState("");
  const [filterLast, setFilterLast] = useState("");
  const [sortAvg, setSortAvg] = useState(""); // "" | "asc" | "desc"

  const load = async () => {
    setLoading(true);
    try {
      const [s, g] = await Promise.all([
        gradeService.getStudentsForSection(grade, section),
        gradeService.getGrades(currentUser, { grade, section, subject }),
      ]);
      setStudents(s);
      setGrades(g);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [grade, section, subject]);

  // Build lookup: [studentEmail][evaluationId] → grade record
  const scoreMap = {};
  grades.forEach((g) => {
    if (!scoreMap[g.studentEmail]) scoreMap[g.studentEmail] = {};
    scoreMap[g.studentEmail][g.evaluationId] = g;
  });

  const startEdit = (studentEmail, evaluationId, existingRecord) => {
    setEditing({ studentEmail, evaluationId });
    setEditScore(existingRecord ? String(existingRecord.score) : "");
    setError("");
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditScore("");
    setError("");
  };

  const saveScore = async () => {
    if (!editing) return;
    const score = Number(editScore);
    if (isNaN(score) || score < 0 || score > 100) {
      setError("Score must be between 0 and 100");
      return;
    }
    setError("");
    try {
      const existing = scoreMap[editing.studentEmail]?.[editing.evaluationId];
      if (existing && !existing.annulled) {
        // Update existing
        await gradeService.updateGrade(existing._id, { score });
      } else {
        // Create new
        await gradeService.createGrade({
          evaluationId: editing.evaluationId,
          studentEmail: editing.studentEmail,
          subject,
          grade,
          section,
          score,
          teacherEmail: currentUser.email,
          annulled: false,
        });
      }
      cancelEdit();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleAnnul = async (gradeId) => {
    if (
      !window.confirm(
        "Annul this grade? It will be marked as void but kept in records.",
      )
    )
      return;
    setError("");
    try {
      await gradeService.annulGrade(gradeId);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleUnannul = async (gradeId) => {
    if (!window.confirm("Restore this grade? It will be active again.")) return;
    setError("");
    try {
      await gradeService.unannulGrade(gradeId);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async (gradeId) => {
    if (!window.confirm("Permanently delete this grade?")) return;
    setError("");
    try {
      await gradeService.deleteGrade(gradeId);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  // Weighted average for a student
  const calcAverage = (studentEmail) => {
    let sum = 0,
      covered = 0;
    evaluations.forEach((ev) => {
      const rec = scoreMap[studentEmail]?.[ev._id];
      if (rec && !rec.annulled) {
        sum += (rec.score / 100) * ev.percentage;
        covered += ev.percentage;
      }
    });
    if (covered === 0) return null;
    return covered === 100
      ? sum.toFixed(1)
      : `~${((sum / covered) * 100).toFixed(1)}`;
  };

  // ── Filtered + sorted student list ───────────────────────
  const displayedStudents = useMemo(() => {
    let list = [...students];
    if (filterFirst.trim()) {
      const q = filterFirst.trim().toLowerCase();
      list = list.filter((s) => s.firstName?.toLowerCase().includes(q));
    }
    if (filterLast.trim()) {
      const q = filterLast.trim().toLowerCase();
      list = list.filter((s) => s.lastName?.toLowerCase().includes(q));
    }
    if (sortAvg) {
      list.sort((a, b) => {
        const parseAvg = (s) =>
          s === null ? -1 : parseFloat(String(s).replace("~", "")) || -1;
        const avgA = parseAvg(calcAverage(a.email));
        const avgB = parseAvg(calcAverage(b.email));
        return sortAvg === "desc" ? avgB - avgA : avgA - avgB;
      });
    }
    return list;
  }, [students, filterFirst, filterLast, sortAvg]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFiltered = filterFirst || filterLast || sortAvg;
  const clearFilters = () => {
    setFilterFirst("");
    setFilterLast("");
    setSortAvg("");
  };

  if (loading) return <p className="sgt-loading">Loading students...</p>;

  return (
    <div className="sgt-container">
      <div className="sgt-header">
        <h4>Student Grades</h4>
        {/* ── Filter bar ── */}
        <div className="sgt-filters">
          <input
            className="sgt-filter-input"
            placeholder="First name…"
            value={filterFirst}
            onChange={(e) => setFilterFirst(e.target.value)}
          />
          <input
            className="sgt-filter-input"
            placeholder="Last name…"
            value={filterLast}
            onChange={(e) => setFilterLast(e.target.value)}
          />
          <select
            className="sgt-filter-select"
            value={sortAvg}
            onChange={(e) => setSortAvg(e.target.value)}
          >
            <option value="">Sort by avg…</option>
            <option value="desc">Highest first</option>
            <option value="asc">Lowest first</option>
          </select>
          {isFiltered && (
            <button className="sgt-clear-btn" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>
      </div>
      {error && <div className="sgt-error">{error}</div>}

      {displayedStudents.length === 0 ? (
        <p className="sgt-empty">
          {isFiltered
            ? "No students match the current filters."
            : `No students found in Grade ${grade}-${section}.`}
        </p>
      ) : (
        <div className="sgt-scroll">
          <table className="sgt-table">
            <thead>
              <tr>
                <th className="sgt-th--name">Student</th>
                {evaluations.map((ev) => (
                  <th key={ev._id} className="sgt-th--ev">
                    <div>{ev.name}</div>
                    <div className="sgt-ev-pct">{ev.percentage}%</div>
                  </th>
                ))}
                <th className="sgt-th--avg">Average</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((student) => {
                const avg = calcAverage(student.email);
                return (
                  <tr key={student.email}>
                    <td className="sgt-td--name">
                      <div className="sgt-student-name">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="sgt-student-email">{student.email}</div>
                    </td>

                    {evaluations.map((ev) => {
                      const rec = scoreMap[student.email]?.[ev.id || ev._id];
                      const isEditing =
                        editing?.studentEmail === student.email &&
                        editing?.evaluationId === ev._id;

                      return (
                        <td
                          key={ev._id}
                          className={`sgt-td--score ${rec?.annulled ? "sgt-td--annulled" : ""}`}
                        >
                          {isEditing ? (
                            <div className="sgt-edit-cell">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={editScore}
                                onChange={(e) => setEditScore(e.target.value)}
                                className="sgt-score-input"
                                autoFocus
                              />
                              <button
                                className="btn btn--save btn--xs"
                                onClick={saveScore}
                              >
                                ✓
                              </button>
                              <button
                                className="btn btn--cancel btn--xs"
                                onClick={cancelEdit}
                              >
                                ✕
                              </button>
                            </div>
                          ) : rec ? (
                            <div className="sgt-score-cell">
                              <span
                                className={`sgt-score ${rec.annulled ? "sgt-score--annulled" : getScoreClass(rec.score)}`}
                              >
                                {rec.annulled ? <s>{rec.score}</s> : rec.score}
                              </span>
                              {!rec.annulled && (
                                <div className="sgt-cell-actions">
                                  <button
                                    className="btn btn--edit btn--xs"
                                    onClick={() =>
                                      startEdit(student.email, ev._id, rec)
                                    }
                                    title="Edit"
                                  >
                                    ✎
                                  </button>
                                  <button
                                    className="btn btn--warn btn--xs"
                                    onClick={() => handleAnnul(rec._id)}
                                    title="Annul"
                                  >
                                    ⊘
                                  </button>
                                  <button
                                    className="btn btn--delete btn--xs"
                                    onClick={() => handleDelete(rec._id)}
                                    title="Delete"
                                  >
                                    🗑
                                  </button>
                                </div>
                              )}
                              {rec.annulled && (
                                <div className="sgt-cell-annulled">
                                  <span className="sgt-annulled-label">
                                    Annulled
                                  </span>
                                  <div className="sgt-cell-actions">
                                    <button
                                      className="btn btn--save btn--xs"
                                      onClick={() => handleUnannul(rec._id)}
                                      title="Restore grade"
                                    >
                                      ↩ Restore
                                    </button>
                                    <button
                                      className="btn btn--delete btn--xs"
                                      onClick={() => handleDelete(rec._id)}
                                      title="Delete permanently"
                                    >
                                      🗑
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              className="btn btn--add-score"
                              onClick={() =>
                                startEdit(student.email, ev._id, null)
                              }
                              title="Add grade"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}

                    <td
                      className={`sgt-td--avg ${avg !== null ? getScoreClass(parseFloat(avg)) : ""}`}
                    >
                      {avg !== null ? (
                        <strong>{avg}</strong>
                      ) : (
                        <span className="sgt-pending">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const getScoreClass = (score) => {
  if (score >= 80) return "sgt-score--good";
  if (score >= 60) return "sgt-score--mid";
  return "sgt-score--low";
};

export default StudentGradeTable;
