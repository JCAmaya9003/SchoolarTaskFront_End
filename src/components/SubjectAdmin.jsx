/**
 * SubjectAdmin — Create and manage subjects.
 * + Submit-time custom validation (useFormErrors).
 */
import { useState, useEffect, useCallback, useRef } from "react";
import useFetch from "../hooks/UseFetch";
import FormInput from "./FormInput";
import useFormErrors from "../hooks/useFormErrors";
import FieldError from "./FieldError";
import * as gradeService from "../services/gradeService";
import "../assets/AdminPanel.css";
import "../assets/form.css";

// ── Validation ────────────────────────────────────────────────────
const validateSubject = ({ name }) => {
  const errs = {};
  if (!name.trim()) {
    errs.name = "Subject name is required.";
  } else if (name.trim().length < 2) {
    errs.name = "Subject name must be at least 2 characters.";
  } else if (name.trim().length > 60) {
    errs.name = "Subject name must be 60 characters or fewer.";
  }
  return errs;
};

const SubjectAdmin = () => {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [editingSubject, setEditingSubject] = useState(null);
  const formCardRef = useRef(null);

  const fetchSubjects = useCallback(() => gradeService.getSubjects(), []);
  const { data, error, isLoading, refetch } = useFetch(fetchSubjects);

  useEffect(() => {
    if (data) setSubjects(data);
  }, [data]);

  const handleChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      clearFieldError(name);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── Submit logic ─────────────────────────────────────────────
  const doSubmit = useCallback(
    async (data) => {
      try {
        if (editingSubject) {
          await gradeService.deleteSubject(editingSubject);
          await gradeService.createSubject(data);
          setEditingSubject(null);
        } else {
          await gradeService.createSubject(data);
        }
        setFormData({ name: "" });
        clearErrors();
        refetch();
      } catch (err) {
        alert("Error: " + err.message);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editingSubject, refetch],
  );

  const { errors, trySubmit, clearFieldError, clearErrors } = useFormErrors(
    validateSubject,
    doSubmit,
  );

  const handleEdit = useCallback(
    (name) => {
      setEditingSubject(name);
      setFormData({ name });
      clearErrors();
      setTimeout(
        () =>
          formCardRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        50,
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleCancelEdit = useCallback(() => {
    setEditingSubject(null);
    setFormData({ name: "" });
    clearErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = useCallback(
    async (name) => {
      if (!window.confirm(`Delete subject "${name}"?`)) return;
      try {
        await gradeService.deleteSubject(name);
        refetch();
      } catch (err) {
        alert("Error: " + err.message);
      }
    },
    [refetch],
  );

  return (
    <div className="apanel">
      {/* Create / Edit form */}
      <div className="apanel-form-card" ref={formCardRef}>
        <h3 className="apanel-form-title">
          {editingSubject ? `Editing "${editingSubject}"` : "Add Subject"}
        </h3>
        <form
          onSubmit={(e) => trySubmit(e, formData)}
          className="apanel-form"
          noValidate
        >
          <div className={errors.name ? "field-has-error" : ""}>
            <FormInput
              name="name"
              label="Subject Name"
              value={formData.name}
              onChange={handleChange}
            />
            <FieldError message={errors.name} />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit" className="btn btn-primary">
              {editingSubject ? "Save" : "Add Subject"}
            </button>
            {editingSubject && (
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

      {/* List */}
      <div className="apanel-list-card">
        <h3 className="apanel-list-title">
          Subjects
          <span className="apanel-count">{subjects.length}</span>
        </h3>

        {isLoading && <p className="apanel-loading">Loading...</p>}
        {error && <p className="apanel-error">{error.message}</p>}

        {!isLoading && subjects.length === 0 && (
          <p className="apanel-empty">No subjects yet. Add one above.</p>
        )}

        <ul className="apanel-items">
          {subjects.map((subject, i) => {
            const name = typeof subject === "string" ? subject : subject.name;
            const id =
              typeof subject === "string"
                ? subject
                : subject._id || subject.name;
            return (
              <li key={id || i} className="apanel-item">
                <span className="apanel-item-name">{name}</span>
                <div className="apanel-item-actions">
                  <button
                    className="btn btn-info btn-sm"
                    onClick={() => handleEdit(name)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(name)}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default SubjectAdmin;
