/**
 * EvaluationPlan Component
 *
 * Panel A for Admin/Teacher: CRUD for evaluations (graded items with % weights).
 * Total percentage must sum to exactly 100% for the subject plan to be complete.
 *
 * APPROVAL WORKFLOW:
 * - "draft": teacher can add/edit/delete evaluations, admin can approve when at 100%
 * - "approved": teacher CANNOT edit plan; admin CAN still edit name/weight; grading unlocked
 */

import { useState, useEffect } from "react";
import * as gradeService from "../../services/gradeService";
import useToast from "../../hooks/useToast";
import Toast from "../Toast";

const EvaluationPlan = ({
  grade,
  section,
  subject,
  currentUser,
  onPlanStatusChange,
}) => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", percentage: "" });
  const [error, setError] = useState("");
  const [planStatus, setPlanStatus] = useState("draft");
  const [pendingDeleteId, setPendingDeleteId] = useState(null); // id awaiting confirm
  const { toasts, showToast, dismissToast } = useToast();

  const isAdmin = currentUser?.role === "admin";
  const isTeacher = currentUser?.role === "teacher";

  const totalPct = evaluations.reduce(
    (sum, e) => sum + Number(e.percentage),
    0,
  );
  const remaining = 100 - totalPct;

  const load = async () => {
    setLoading(true);
    try {
      const data = await gradeService.getEvaluations(grade, section, subject);
      const status = gradeService.getPlanStatus(grade, section, subject);
      setEvaluations(data);
      setPlanStatus(status);
      onPlanStatusChange?.(status);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [grade, section, subject]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setForm({ name: "", percentage: "" });
    setEditing(null);
    setError("");
  };

  const canEditPlan = isAdmin || (isTeacher && planStatus === "draft");

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Evaluation name is required.");
      return;
    }
    const pct = Number(form.percentage);
    if (!pct || pct < 1 || pct > remaining) {
      setError(`Percentage must be between 1 and ${remaining}.`);
      return;
    }
    setError("");
    try {
      await gradeService.createEvaluation({
        name: form.name.trim(),
        percentage: pct,
        subject,
        grade,
        section,
      });
      showToast(`Evaluation "${form.name.trim()}" added.`, "success");
      resetForm();
      await load();
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleEditStart = (ev) => {
    setEditing(ev._id);
    setForm({ name: ev.name, percentage: String(ev.percentage) });
    setError("");
  };

  const handleEditSave = async (id) => {
    if (!form.name.trim()) {
      setError("Evaluation name is required.");
      return;
    }
    const pct = Number(form.percentage);
    if (!pct || pct < 1) {
      setError("Percentage must be at least 1.");
      return;
    }
    setError("");
    try {
      await gradeService.updateEvaluation(id, {
        name: form.name.trim(),
        percentage: pct,
      });
      showToast(`Evaluation updated.`, "success");
      resetForm();
      await load();
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleDelete = async (id, name) => {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      return;
    }
    setPendingDeleteId(null);
    setError("");
    try {
      await gradeService.deleteEvaluation(id);
      showToast(`Evaluation "${name}" deleted.`, "success");
      await load();
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleApprove = () => {
    try {
      gradeService.approvePlan(grade, section, subject);
      setPlanStatus("approved");
      onPlanStatusChange?.("approved");
      showToast(
        "Evaluation plan approved! Grading is now unlocked.",
        "success",
      );
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleRevertDraft = () => {
    try {
      gradeService.revertPlanToDraft(grade, section, subject);
      setPlanStatus("draft");
      onPlanStatusChange?.("draft");
      showToast("Plan reverted to Draft. Teachers can now edit it.", "success");
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  if (loading) return <p className="ep-loading">Loading evaluation plan...</p>;

  const isComplete = totalPct === 100;

  return (
    <>
      <div className="ep-container">
        <div className="ep-header">
          <h4>Evaluation Plan</h4>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {/* Status badge */}
            <span className={`ep-status-badge ep-status--${planStatus}`}>
              {planStatus === "approved" ? "✓ Approved" : "⏳ Draft"}
            </span>

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

            {/* Admin: approve / revert buttons */}
            {isAdmin && isComplete && planStatus === "draft" && (
              <button
                className="btn btn-primary btn-sm"
                onClick={handleApprove}
              >
                Approve Plan
              </button>
            )}
            {isAdmin && planStatus === "approved" && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleRevertDraft}
                title="Revert to draft to allow teacher edits"
              >
                Revert to Draft
              </button>
            )}
          </div>
        </div>

        {error && <div className="ep-error">{error}</div>}

        {/* Teacher locked message */}
        {isTeacher && planStatus === "approved" && (
          <div className="ep-locked-notice">
            Plan is approved — contact your administrator to make changes.
          </div>
        )}
        {isTeacher && planStatus === "draft" && isComplete && (
          <div className="ep-ready-notice">
            Plan is complete (100%). Awaiting admin approval before grading can
            begin.
          </div>
        )}

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
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
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
                  {canEditPlan ? (
                    editing === ev._id ? (
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
                        {pendingDeleteId === ev._id ? (
                          <>
                            <span style={{ fontSize: 12, color: "#B45309" }}>
                              Grades will be removed!
                            </span>
                            <button
                              className="btn btn--delete"
                              onClick={() => handleDelete(ev._id, ev.name)}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn--cancel"
                              onClick={() => setPendingDeleteId(null)}
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn--delete"
                            onClick={() => handleDelete(ev._id, ev.name)}
                          >
                            Delete
                          </button>
                        )}
                      </>
                    )
                  ) : (
                    /* Admin post-approval: can edit but not delete */
                    isAdmin &&
                    planStatus === "approved" &&
                    editing !== ev._id && (
                      <button
                        className="btn btn--edit"
                        onClick={() => handleEditStart(ev)}
                      >
                        Edit
                      </button>
                    )
                  )}
                  {isAdmin &&
                    planStatus === "approved" &&
                    editing === ev._id && (
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
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add form — only when plan is not yet approved AND there's room */}
        {!editing && remaining > 0 && canEditPlan && planStatus === "draft" && (
          <form className="ep-add-form" onSubmit={handleAdd}>
            <h5>Add Evaluation</h5>
            <div className="ep-add-row">
              <input
                placeholder="Evaluation name (e.g. Final Exam)"
                value={form.name}
                onChange={(e) => {
                  setForm({ ...form, name: e.target.value });
                  setError("");
                }}
                className={`ep-input ep-input--name${error && !form.name.trim() ? " ep-input--error" : ""}`}
              />
              <input
                type="number"
                min="1"
                max={remaining}
                placeholder={`% (max ${remaining})`}
                value={form.percentage}
                onChange={(e) => {
                  setForm({ ...form, percentage: e.target.value });
                  setError("");
                }}
                className={`ep-input ep-input--pct${error && !form.percentage ? " ep-input--error" : ""}`}
              />
              <button type="submit" className="btn btn--add">
                Add
              </button>
            </div>
            {error && (
              <p
                className="ep-form-error"
                role="alert"
                style={{
                  color: "var(--color-error, #e53e3e)",
                  fontSize: 13,
                  marginTop: 6,
                }}
              >
                {error}
              </p>
            )}
          </form>
        )}
      </div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
};

export default EvaluationPlan;
