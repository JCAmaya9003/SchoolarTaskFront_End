/**
 * EvaluationPlan Component
 *
 * Panel A for Admin/Teacher: CRUD for evaluations (graded items with % weights).
 * Total percentage must sum to exactly 100% for the subject plan to be complete.
 */

import { useState, useEffect } from "react";
import * as gradeService from "../../services/gradeService";

const EvaluationPlan = ({ grade, section, subject, currentUser }) => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // id of row being edited
  const [form, setForm] = useState({ name: "", percentage: "" });
  const [error, setError] = useState("");

  const totalPct = evaluations.reduce(
    (sum, e) => sum + Number(e.percentage),
    0,
  );
  const remaining = 100 - totalPct;

  const load = async () => {
    setLoading(true);
    try {
      const data = await gradeService.getEvaluations(grade, section, subject);
      setEvaluations(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [grade, section, subject]);

  const resetForm = () => {
    setForm({ name: "", percentage: "" });
    setEditing(null);
    setError("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await gradeService.createEvaluation({
        name: form.name.trim(),
        percentage: Number(form.percentage),
        subject,
        grade,
        section,
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEditStart = (ev) => {
    setEditing(ev._id);
    setForm({ name: ev.name, percentage: String(ev.percentage) });
    setError("");
  };

  const handleEditSave = async (id) => {
    setError("");
    try {
      await gradeService.updateEvaluation(id, {
        name: form.name.trim(),
        percentage: Number(form.percentage),
      });
      resetForm();
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Delete this evaluation? This cannot be undone if no grades are linked.",
      )
    )
      return;
    setError("");
    try {
      await gradeService.deleteEvaluation(id);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p className="ep-loading">Loading evaluation plan...</p>;

  const isComplete = totalPct === 100;

  return (
    <div className="ep-container">
      <div className="ep-header">
        <h4>Evaluation Plan</h4>
        <div
          className={`ep-total ${isComplete ? "ep-total--ok" : totalPct > 100 ? "ep-total--over" : "ep-total--under"}`}
        >
          <span>
            Total: <strong>{totalPct}%</strong>
          </span>
          {!isComplete && (
            <span className="ep-remaining">
              {" "}
              (
              {remaining > 0
                ? `${remaining}% remaining`
                : "OVER by " + Math.abs(remaining) + "%"}
              )
            </span>
          )}
          {isComplete && <span className="ep-check">Complete</span>}
        </div>
      </div>

      {error && <div className="ep-error">{error}</div>}

      <table className="ep-table">
        <thead>
          <tr>
            <th>Evaluation Name</th>
            <th>Weight (%)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {evaluations.length === 0 && (
            <tr>
              <td colSpan={3} className="ep-empty">
                No evaluations yet. Add the first one below.
              </td>
            </tr>
          )}
          {evaluations.map((ev) => (
            <tr
              key={ev._id}
              className={editing === ev._id ? "ep-row--editing" : ""}
            >
              <td>
                {editing === ev._id ? (
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="ep-input"
                  />
                ) : (
                  ev.name
                )}
              </td>
              <td>
                {editing === ev._id ? (
                  <input
                    type="number"
                    value={form.percentage}
                    min="1"
                    max="100"
                    onChange={(e) =>
                      setForm({ ...form, percentage: e.target.value })
                    }
                    className="ep-input ep-input--pct"
                  />
                ) : (
                  <strong>{ev.percentage}%</strong>
                )}
              </td>
              <td className="ep-actions">
                {editing === ev._id ? (
                  <>
                    <button
                      className="btn btn--save"
                      onClick={() => handleEditSave(ev._id)}
                    >
                      Save
                    </button>
                    <button className="btn btn--cancel" onClick={resetForm}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn--edit"
                      onClick={() => handleEditStart(ev)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn--delete"
                      onClick={() => handleDelete(ev._id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add new evaluation */}
      {!editing && remaining > 0 && (
        <form className="ep-add-form" onSubmit={handleAdd}>
          <h5>Add Evaluation</h5>
          <div className="ep-add-row">
            <input
              placeholder="Evaluation name (e.g. Final Exam)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="ep-input ep-input--name"
            />
            <input
              type="number"
              min="1"
              max={remaining}
              placeholder={`% (max ${remaining})`}
              value={form.percentage}
              onChange={(e) => setForm({ ...form, percentage: e.target.value })}
              required
              className="ep-input ep-input--pct"
            />
            <button type="submit" className="btn btn--add">
              Add
            </button>
          </div>
        </form>
      )}

      {!editing && isComplete && (
        <p className="ep-plan-complete">
          This subject's evaluation plan is complete (100%).
        </p>
      )}
    </div>
  );
};

export default EvaluationPlan;
