/**
 * GradeSectionAdmin — Manage grade-section combinations and subjects.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import useFetch from "../hooks/UseFetch";
import useFormErrors from "../hooks/useFormErrors";
import FieldError from "./FieldError";
import * as gradeService from "../services/gradeService";
import "../assets/AdminPanel.css";
import "../assets/form.css";

// ── Validation ───────────────────────────────────────────────
const validateGradeSection = ({ grade, section, subjects }) => {
  const errs = {};
  if (!grade) errs.grade = "Please select a grade (1–12).";
  if (!section.trim()) {
    errs.section = "Section is required.";
  } else if (!/^[A-Z]$/.test(section)) {
    errs.section = "Section must be a single letter (A–Z).";
  }
  if (!subjects || subjects.length === 0)
    errs.subjects = "Select at least one subject for this grade section.";
  return errs;
};

const GradeSectionAdmin = () => {
  const [gradeSections, setGradeSections] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const formCardRef = useRef(null);
  const [formData, setFormData] = useState({
    grade: "",
    section: "",
    subjects: [],
  });

  const fetchGradeSections = useCallback(
    () => gradeService.getGradeSections(),
    [],
  );
  const fetchSubjects = useCallback(() => gradeService.getSubjects(), []);

  const { data: gsData, refetch } = useFetch(fetchGradeSections);
  const { data: subData } = useFetch(fetchSubjects);

  useEffect(() => {
    if (gsData) setGradeSections(gsData);
  }, [gsData]);
  useEffect(() => {
    if (subData) setSubjects(subData);
  }, [subData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "section") {
      const letter = value
        .replace(/[^a-zA-Z]/g, "")
        .slice(0, 1)
        .toUpperCase();
      setFormData((p) => ({ ...p, section: letter }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
    clearFieldError(name);
  };

  const handleCheckbox = (e) => {
    const { value, checked } = e.target;
    setFormData((p) => ({
      ...p,
      subjects: checked
        ? [...p.subjects, value]
        : p.subjects.filter((s) => s !== value),
    }));
    clearFieldError("subjects");
  };

  const handleEdit = (gs) => {
    setEditingSection({ grade: gs.grade, section: gs.section });
    setFormData({
      grade: gs.grade,
      section: gs.section,
      subjects: gs.subjects || [],
    });
    clearErrors();
    setTimeout(
      () =>
        formCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setFormData({ grade: "", section: "", subjects: [] });
    clearErrors();
  };

  const handleDelete = async (grade, section) => {
    if (!window.confirm(`Delete grade ${grade}-${section}?`)) return;
    try {
      await gradeService.deleteGradeSection(grade, section);
      refetch();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  // ── Submit logic ─────────────────────────────────────────────
  const doSubmit = useCallback(
    async (data) => {
      try {
        if (editingSection) {
          await gradeService.updateGradeSection(
            editingSection.grade,
            editingSection.section,
            { subjects: data.subjects },
          );
          setEditingSection(null);
        } else {
          await gradeService.createGradeSection(data);
        }
        setFormData({ grade: "", section: "", subjects: [] });
        clearErrors();
        refetch();
      } catch (err) {
        alert("Error: " + err.message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingSection, refetch],
  );

  const { errors, trySubmit, clearFieldError, clearErrors } = useFormErrors(
    validateGradeSection,
    doSubmit,
  );

  return (
    <div className="apanel">
      {/* Create / Edit form */}
      <div className="apanel-form-card" ref={formCardRef}>
        <h3 className="apanel-form-title">
          {editingSection
            ? `Editing Grade ${editingSection.grade}‑${editingSection.section}`
            : "New Grade Section"}
        </h3>
        <form
          onSubmit={(e) => trySubmit(e, formData)}
          className="apanel-form"
          noValidate
        >
          <div className="apanel-row">
            <div>
              <label className="apanel-label">Grade *</label>
              <select
                name="grade"
                className="apanel-input"
                value={formData.grade}
                onChange={handleChange}
                required
                disabled={!!editingSection}
              >
                <option value="">Select grade…</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <FieldError message={errors.grade} />
            </div>
            <div>
              <label className="apanel-label">Section *</label>
              <input
                name="section"
                className="apanel-input"
                value={formData.section}
                onChange={handleChange}
                placeholder="e.g. A"
                maxLength={1}
                pattern="[A-Za-z]"
                required
                disabled={!!editingSection}
                style={{ textTransform: "uppercase" }}
              />
              <FieldError message={errors.section} />
            </div>
          </div>

          <div className="apanel-field">
            <label className="apanel-label">Subjects *</label>
            {subjects.length === 0 ? (
              <p className="apanel-empty">
                No subjects available — create subjects first.
              </p>
            ) : (
              <div className="apanel-checkboxes">
                {subjects.map((s, i) => {
                  const name = typeof s === "string" ? s : s.name;
                  const id = typeof s === "string" ? s : s._id || s.name;
                  return (
                    <label key={id || i} className="apanel-checkbox-label">
                      <input
                        type="checkbox"
                        value={name}
                        checked={formData.subjects.includes(name)}
                        onChange={handleCheckbox}
                        className="apanel-checkbox"
                      />
                      {name}
                    </label>
                  );
                })}
              </div>
            )}
            <FieldError message={errors.subjects} />
          </div>

          <div className="apanel-actions">
            <button type="submit" className="btn btn-primary">
              {editingSection ? "Update" : "Create"} Section
            </button>
            {editingSection && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Sections list */}
      <div className="apanel-list-card">
        <h3 className="apanel-list-title">
          Grade Sections
          <span className="apanel-count">{gradeSections.length}</span>
        </h3>

        {gradeSections.length === 0 && (
          <p className="apanel-empty">No grade sections yet.</p>
        )}

        <ul className="apanel-items">
          {gradeSections.map((gs, i) => (
            <li key={`${gs.grade}-${gs.section}-${i}`} className="apanel-item">
              <div className="apanel-item-main">
                <span className="apanel-item-badge">Grade {gs.grade}</span>
                <span className="apanel-item-name">Section {gs.section}</span>
                {gs.subjects && gs.subjects.length > 0 && (
                  <span className="apanel-item-sub">
                    {gs.subjects.join(" · ")}
                  </span>
                )}
              </div>
              <div className="apanel-item-actions">
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => handleEdit(gs)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(gs.grade, gs.section)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GradeSectionAdmin;
