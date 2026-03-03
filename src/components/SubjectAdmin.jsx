/**
 * SubjectAdmin — Create and manage subjects.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import useFetch from "../hooks/UseFetch";
import FormInput from "./FormInput";
import * as gradeService from "../services/gradeService";
import "../assets/AdminPanel.css";

const SubjectAdmin = () => {
  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [editingSubject, setEditingSubject] = useState(null); // name of subject being edited
  const formCardRef = useRef(null);

  const fetchSubjects = useCallback(() => gradeService.getSubjects(), []);
  const { data, error, isLoading, refetch } = useFetch(fetchSubjects);

  useEffect(() => {
    if (data) setSubjects(data);
  }, [data]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        if (editingSubject) {
          // Rename: delete old, create new
          await gradeService.deleteSubject(editingSubject);
          await gradeService.createSubject(formData);
          setEditingSubject(null);
        } else {
          await gradeService.createSubject(formData);
        }
        setFormData({ name: "" });
        refetch();
      } catch (err) {
        alert("Error: " + err.message);
      }
    },
    [formData, editingSubject, refetch],
  );

  const handleEdit = useCallback((name) => {
    setEditingSubject(name);
    setFormData({ name });
    setTimeout(
      () =>
        formCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingSubject(null);
    setFormData({ name: "" });
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
        <form onSubmit={handleSubmit} className="apanel-form">
          <FormInput
            name="name"
            label="Subject Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
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
