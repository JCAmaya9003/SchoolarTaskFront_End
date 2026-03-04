/**
 * StudentGradeTable Component
 *
 * Panel B for Admin/Teacher: grid of students × evaluations.
 * Grading is LOCKED until the evaluation plan is approved.
 * Shows "% Done" column — accumulated weight of graded evaluations per student.
 */

import { useState, useEffect, useMemo } from "react";
import * as gradeService from "../../services/gradeService";

const StudentGradeTable = ({
  grade,
  section,
  subject,
  evaluations,
  currentUser,
  planStatus, // "draft" | "approved" — passed from EvaluationAdmin
}) => {
  const [students, setStudents] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [editScore, setEditScore] = useState("");
  const [error, setError] = useState("");

  // ── Filters ──────────────────────────────────────────────
  const [filterFirst, setFilterFirst] = useState("");
  const [filterLast, setFilterLast] = useState("");
  const [sortAvg, setSortAvg] = useState("");

  const planApproved = planStatus === "approved";

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
  }, [grade, section, subject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Build lookup: [studentEmail][evaluationId] → grade record
  const scoreMap = {};
  grades.forEach((g) => {
    if (!scoreMap[g.studentEmail]) scoreMap[g.studentEmail] = {};
    scoreMap[g.studentEmail][g.evaluationId] = g;
  });

  const startEdit = (studentEmail, evaluationId, existingRecord) => {
    if (!planApproved) return; // guard
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
        await gradeService.updateGrade(existing._id, { score });
      } else {
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

  // % Done: sum of weights for evaluations that have a non-annulled grade
  const calcCoveredPct = (studentEmail) => {
    return evaluations.reduce((sum, ev) => {
      const rec = scoreMap[studentEmail]?.[ev._id];
      return sum + (rec && !rec.annulled ? ev.percentage : 0);
    }, 0);
  };

  // Accumulated weighted score: sum of (score * percentage/100) for graded evals
  const calcAccumulated = (studentEmail) => {
    let sum = 0;
    evaluations.forEach((ev) => {
      const rec = scoreMap[studentEmail]?.[ev._id];
      if (rec && !rec.annulled) {
        sum += rec.score * (ev.percentage / 100);
      }
    });
    return sum;
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

  // ── Approval gate ─────────────────────────────────────────
  if (!planApproved) {
    return (
      <div className="sgt-container">
        <div className="sgt-header">
          <h4>Student Grades</h4>
        </div>
        <div className="sgt-locked">
          <svg
            width="32"
            height="32"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
          <p>
            <strong>Grading is locked</strong>
          </p>
          <p className="sgt-locked-sub">
            The evaluation plan must be complete (100%) and approved by an
            administrator before grades can be entered.
          </p>
        </div>
      </div>
    );
  }

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
                <th className="sgt-th--done" title="% of plan graded">
                  % Done
                </th>
                <th
                  className="sgt-th--accum"
                  title="Accumulated weighted score"
                >
                  Accum.
                </th>
                <th className="sgt-th--avg">Average</th>
              </tr>
            </thead>
            <tbody>
              {displayedStudents.map((student) => {
                const avg = calcAverage(student.email);
                const coveredPct = calcCoveredPct(student.email);
                const accum = calcAccumulated(student.email);
                const doneBadge =
                  coveredPct === 100
                    ? "sgt-done--full"
                    : coveredPct >= 50
                      ? "sgt-done--mid"
                      : coveredPct > 0
                        ? "sgt-done--low"
                        : "sgt-done--zero";

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

                    {/* % Done column */}
                    <td className={`sgt-td--done ${doneBadge}`}>
                      <strong>{coveredPct}%</strong>
                    </td>

                    {/* Accumulated weighted score column */}
                    <td className="sgt-td--accum">
                      <span
                        className={
                          accum >= 70
                            ? "sgt-done--full"
                            : accum >= 50
                              ? "sgt-done--mid"
                              : accum > 0
                                ? "sgt-done--low"
                                : "sgt-done--zero"
                        }
                      >
                        {accum > 0 ? accum.toFixed(2) : "—"}
                      </span>
                    </td>

                    {/* Average column */}
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
