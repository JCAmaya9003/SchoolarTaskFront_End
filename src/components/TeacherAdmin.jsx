/**
 * TeacherAdmin — Manage teachers (CRUD) + client-side filters.
 * Filters: by name, by grade/section (from assignments), by subject.
 * Layout: form first (top), filter bar + list below.
 */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useFetch from "../hooks/UseFetch";
import usePost from "../hooks/UsePost";
import useUpdate from "../hooks/UseUpdate";
import useDelete from "../hooks/UseDelete";
import useFormErrors from "../hooks/useFormErrors";
import FormInput from "./FormInput";
import PhoneInput from "./PhoneInput";
import FieldError from "./FieldError";
import useCountries from "../hooks/useCountries";
import * as userService from "../services/userService";
import * as gradeService from "../services/gradeService";
import UserInfoModal from "./UserInfoModal";
import "../assets/form.css";
import "../assets/UserPanel.css";

// ── Validation ───────────────────────────────────────────────
const validateTeacher = (fd) => {
  const errs = {};
  if (!fd.firstName.trim()) errs.firstName = "First name is required.";
  if (!fd.lastName.trim()) errs.lastName = "Last name is required.";
  if (!fd.email.trim()) {
    errs.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fd.email)) {
    errs.email = "Enter a valid email address.";
  }
  if (!fd.password) errs.password = "Password is required.";
  if (!fd.birth_date) errs.birth_date = "Date of birth is required.";
  if (!fd.gender) errs.gender = "Please select a gender.";
  if (!fd.nationality) errs.nationality = "Nationality is required.";
  if (!fd.address?.trim()) errs.address = "Address is required.";
  if (!fd.speciality?.trim()) errs.speciality = "Speciality is required.";
  if (!fd.phone) errs.phone = "Phone number is required.";
  fd.assignments.forEach((a, i) => {
    if (!a.grade_section.grade || !a.grade_section.section)
      errs[`assignment_${i}_section`] =
        `Assignment ${i + 1}: select a grade and section.`;
    else if (a.subjects.length === 0)
      errs[`assignment_${i}_subjects`] =
        `Assignment ${i + 1}: select at least one subject.`;
  });
  const combos = fd.assignments.map(
    (a) => `${a.grade_section.grade}-${a.grade_section.section}`,
  );
  if (combos.length !== new Set(combos).size)
    errs.assignments_dup = "Duplicate grade-section assignments.";
  return errs;
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  birth_date: "",
  roleName: "Teacher",
  gender: "",
  address: "",
  nationality: "",
  phoneDialCode: "+1",
  phone: "",
  speciality: "",
  assignments: [{ subjects: [], grade_section: { grade: "", section: "" } }],
};

const TeacherAdmin = () => {
  const [teachers, setTeachers] = useState([]);
  const [gradeSections, setGradeSections] = useState([]);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0); // increments on reset to remount PhoneInput
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const formCardRef = useRef(null);
  const [showPwd, setShowPwd] = useState(false);

  const { countries, isLoading: loadingCountries } = useCountries();

  // ── Filters ────────────────────────────────────────────────
  const [filterFirstName, setFilterFirstName] = useState("");
  const [filterLastName, setFilterLastName] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [sortLastName, setSortLastName] = useState("");

  const fetchTeachers = useCallback(() => userService.getTeachers(), []);
  const fetchGradeSections = useCallback(
    () => gradeService.getGradeSections(),
    [],
  );

  const { data, error, isLoading, refetch } = useFetch(fetchTeachers);
  const { data: gradeSectionsData } = useFetch(fetchGradeSections);
  const { postData } = usePost();
  const { updateData } = useUpdate();
  const { deleteData } = useDelete();

  useEffect(() => {
    if (data) setTeachers(data);
  }, [data]);
  useEffect(() => {
    if (gradeSectionsData) setGradeSections(gradeSectionsData);
  }, [gradeSectionsData]);

  const resetForm = () => {
    setEditingTeacher(null);
    setFormData(emptyForm);
  };

  // ── Filter derived data ─────────────────────────────────────
  const allSubjects = useMemo(() => {
    const subjects = new Set();
    teachers.forEach((t) =>
      t.assignments?.forEach((a) =>
        a.subjects?.forEach((s) => subjects.add(s)),
      ),
    );
    return [...subjects].sort();
  }, [teachers]);

  const availableGrades = useMemo(() => {
    const grades = [...new Set(gradeSections.map((gs) => gs.grade))];
    return grades.sort((a, b) => Number(a) - Number(b));
  }, [gradeSections]);

  const availableSections = useMemo(() => {
    if (!filterGrade) return [];
    return [
      ...new Set(
        gradeSections
          .filter((gs) => String(gs.grade) === String(filterGrade))
          .map((gs) => gs.section),
      ),
    ].sort();
  }, [gradeSections, filterGrade]);

  const displayedTeachers = useMemo(() => {
    let list = [...teachers];
    if (filterFirstName.trim()) {
      const q = filterFirstName.toLowerCase();
      list = list.filter((t) => t.firstName?.toLowerCase().includes(q));
    }
    if (filterLastName.trim()) {
      const q = filterLastName.toLowerCase();
      list = list.filter((t) => t.lastName?.toLowerCase().includes(q));
    }
    if (filterGrade) {
      list = list.filter((t) =>
        t.assignments?.some(
          (a) => String(a.grade_section?.grade) === String(filterGrade),
        ),
      );
      if (filterSection) {
        list = list.filter((t) =>
          t.assignments?.some(
            (a) =>
              String(a.grade_section?.grade) === String(filterGrade) &&
              a.grade_section?.section === filterSection,
          ),
        );
      }
    }
    if (filterSubject) {
      list = list.filter((t) =>
        t.assignments?.some((a) => a.subjects?.includes(filterSubject)),
      );
    }
    if (sortLastName === "asc")
      list = list.sort((a, b) => a.lastName?.localeCompare(b.lastName));
    if (sortLastName === "desc")
      list = list.sort((a, b) => b.lastName?.localeCompare(a.lastName));
    return list;
  }, [
    teachers,
    filterFirstName,
    filterLastName,
    filterGrade,
    filterSection,
    filterSubject,
    sortLastName,
  ]);

  const clearFilters = () => {
    setFilterFirstName("");
    setFilterLastName("");
    setFilterGrade("");
    setFilterSection("");
    setFilterSubject("");
    setSortLastName("");
  };
  const isFiltered =
    filterFirstName ||
    filterLastName ||
    filterGrade ||
    filterSection ||
    filterSubject ||
    sortLastName;

  // ── Form helpers ─────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    clearFieldError(name);
  };

  const handleGradeSectionChange = (idx, field, value) => {
    const updated = [...formData.assignments];
    updated[idx].grade_section[field] = value;
    if (field === "grade") updated[idx].grade_section.section = "";
    updated[idx].subjects = [];
    setFormData({ ...formData, assignments: updated });
  };

  const handleSubjectToggle = (assignIdx, subject) => {
    const updated = [...formData.assignments];
    const subjects = updated[assignIdx].subjects;
    updated[assignIdx].subjects = subjects.includes(subject)
      ? subjects.filter((s) => s !== subject)
      : [...subjects, subject];
    setFormData({ ...formData, assignments: updated });
  };

  const getAvailableGrades = (curIdx) => {
    const all = [...new Set(gradeSections.map((gs) => gs.grade))];
    const taken = formData.assignments
      .map((a, i) =>
        i !== curIdx && a.grade_section.grade && a.grade_section.section
          ? `${a.grade_section.grade}-${a.grade_section.section}`
          : null,
      )
      .filter(Boolean);
    return all.filter((g) =>
      gradeSections
        .filter((gs) => gs.grade === g)
        .some((gs) => !taken.includes(`${g}-${gs.section}`)),
    );
  };

  const getAvailableSections = (curIdx, grade) => {
    if (!grade) return [];
    const all = [
      ...new Set(
        gradeSections
          .filter((gs) => gs.grade === grade)
          .map((gs) => gs.section),
      ),
    ];
    const taken = formData.assignments
      .map((a, i) =>
        i !== curIdx && a.grade_section.grade === grade
          ? a.grade_section.section
          : null,
      )
      .filter(Boolean);
    return all.filter((s) => !taken.includes(s));
  };

  const getSubjectsForAssignment = (idx) => {
    const { grade, section } = formData.assignments[idx].grade_section;
    if (!grade || !section) return [];
    return (
      gradeSections.find((gs) => gs.grade === grade && gs.section === section)
        ?.subjects || []
    );
  };

  const addAssignment = () =>
    setFormData({
      ...formData,
      assignments: [
        ...formData.assignments,
        { subjects: [], grade_section: { grade: "", section: "" } },
      ],
    });
  const removeAssignment = (idx) =>
    setFormData({
      ...formData,
      assignments: formData.assignments.filter((_, i) => i !== idx),
    });

  // ── Submit logic (validation now via useFormErrors) ─────────────
  const doSubmit = async (fd) => {
    // Serialize phone to '+dialCode digits' format
    const phone = fd.phone ? `${fd.phoneDialCode || "+1"} ${fd.phone}` : "";
    const payload = Object.assign({}, fd, { phone, phoneDialCode: undefined });
    try {
      if (editingTeacher) {
        await updateData(
          userService.updateTeacher,
          editingTeacher.email,
          payload,
        );
      } else {
        await postData(userService.createTeacher, payload);
      }
      resetForm();
      setFormKey((k) => k + 1); // remount PhoneInput; clear its internal touched state
      clearErrors(); // clear submit-time validation errors
      refetch();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const { errors, trySubmit, clearFieldError, clearErrors } = useFormErrors(
    validateTeacher,
    doSubmit,
  );

  const handleDelete = async (email) => {
    if (!window.confirm("Delete this teacher?")) return;
    try {
      await deleteData(userService.deleteTeacher, email);
      refetch();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleEdit = (t) => {
    setEditingTeacher(t);
    setFormData(t);
    setTimeout(
      () =>
        formCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  return (
    <div className="upanel">
      {/* ── Form (top) ── */}
      <div className="upanel-form-card" ref={formCardRef}>
        <h3 className="upanel-form-title">
          {editingTeacher
            ? `Editing ${editingTeacher.firstName} ${editingTeacher.lastName}`
            : "Add Teacher"}
        </h3>
        <form onSubmit={(e) => trySubmit(e, formData)} noValidate>
          <div className="upanel-row">
            <div className={errors.firstName ? "field-has-error" : ""}>
              <FormInput
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
              <FieldError message={errors.firstName} />
            </div>
            <div className={errors.lastName ? "field-has-error" : ""}>
              <FormInput
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
              <FieldError message={errors.lastName} />
            </div>
          </div>
          <div className="upanel-row">
            <div className={errors.email ? "field-has-error" : ""}>
              <FormInput
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                type="email"
                disabled={!!editingTeacher}
              />
              <FieldError message={errors.email} />
            </div>
            <div className="upanel-field">
              <label className="upanel-label">
                Password{editingTeacher ? " (leave blank to keep)" : " *"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  className="upanel-input"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPwd ? "text" : "password"}
                  placeholder={
                    editingTeacher ? "Leave blank to keep current" : ""
                  }
                  required={!editingTeacher}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    color: "#94A3B8",
                    display: "flex",
                    alignItems: "center",
                  }}
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="17"
                      height="17"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <FieldError message={errors.password} />
            </div>
          </div>
          <div className="upanel-row">
            <div className={errors.birth_date ? "field-has-error" : ""}>
              <FormInput
                name="birth_date"
                label="Date of Birth"
                value={formData.birth_date}
                onChange={handleChange}
                type="date"
                required
              />
              <FieldError message={errors.birth_date} />
            </div>
            <div
              className={
                errors.nationality
                  ? "upanel-field field-has-error"
                  : "upanel-field"
              }
            >
              <label className="upanel-label">Nationality *</label>
              <select
                name="nationality"
                className="upanel-input"
                value={formData.nationality}
                onChange={handleChange}
              >
                <option value="">Select nationality…</option>
                {!loadingCountries &&
                  countries.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <FieldError message={errors.nationality} />
            </div>
          </div>
          <div className="upanel-row">
            <div
              className={
                errors.gender ? "upanel-field field-has-error" : "upanel-field"
              }
            >
              <label className="upanel-label">Gender *</label>
              <select
                name="gender"
                className="upanel-input"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <FieldError message={errors.gender} />
            </div>
            <div className={errors.address ? "field-has-error" : ""}>
              <FormInput
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <FieldError message={errors.address} />
            </div>
          </div>
          <div className="upanel-row">
            <div>
              <PhoneInput
                key={`teacher-phone-${formKey}`}
                label="Phone"
                dialCode={formData.phoneDialCode}
                phone={formData.phone}
                onChange={({ dialCode, phone }) =>
                  setFormData((p) => ({ ...p, phoneDialCode: dialCode, phone }))
                }
                required
                id="teacher-phone"
              />
              <FieldError message={errors.phone} />
            </div>
            <div className={errors.speciality ? "field-has-error" : ""}>
              <FormInput
                name="speciality"
                label="Speciality"
                value={formData.speciality}
                onChange={handleChange}
                required
              />
              <FieldError message={errors.speciality} />
            </div>
          </div>

          <p className="upanel-section-label">Subject Assignments</p>
          {formData.assignments.map((assignment, idx) => (
            <div key={idx} className="upanel-assignment-card">
              <div className="upanel-assignment-header">
                <span className="upanel-assignment-title">
                  Assignment {idx + 1}
                </span>
                {formData.assignments.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeAssignment(idx)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="upanel-row">
                <div
                  className={
                    errors[`assignment_${idx}_section`] ? "field-has-error" : ""
                  }
                >
                  <label>Grade *</label>
                  <select
                    value={assignment.grade_section.grade}
                    onChange={(e) =>
                      handleGradeSectionChange(idx, "grade", e.target.value)
                    }
                  >
                    <option value="">Select grade</option>
                    {getAvailableGrades(idx).map((g) => (
                      <option key={g} value={g}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className={
                    errors[`assignment_${idx}_section`] ? "field-has-error" : ""
                  }
                >
                  <label>Section *</label>
                  <select
                    value={assignment.grade_section.section}
                    onChange={(e) =>
                      handleGradeSectionChange(idx, "section", e.target.value)
                    }
                    disabled={!assignment.grade_section.grade}
                  >
                    <option value="">Select section</option>
                    {getAvailableSections(
                      idx,
                      assignment.grade_section.grade,
                    ).map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                  <FieldError message={errors[`assignment_${idx}_section`]} />
                </div>
              </div>
              {assignment.grade_section.grade &&
                assignment.grade_section.section && (
                  <div
                    className={
                      errors[`assignment_${idx}_subjects`]
                        ? "upanel-field field-has-error"
                        : "upanel-field"
                    }
                  >
                    <label className="upanel-label">Subjects *</label>
                    <div className="apanel-checkboxes">
                      {getSubjectsForAssignment(idx).map((sub) => (
                        <label key={sub} className="apanel-checkbox-label">
                          <input
                            type="checkbox"
                            className="apanel-checkbox"
                            checked={assignment.subjects.includes(sub)}
                            onChange={() => handleSubjectToggle(idx, sub)}
                          />
                          {sub}
                        </label>
                      ))}
                    </div>
                    <FieldError
                      message={errors[`assignment_${idx}_subjects`]}
                    />
                  </div>
                )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={addAssignment}
            style={{ marginBottom: 12 }}
          >
            + Add Assignment
          </button>

          <div className="upanel-actions">
            <button type="submit" className="btn btn-primary">
              {editingTeacher ? "Update Teacher" : "Create Teacher"}
            </button>
            {editingTeacher && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ── Teacher list (bottom) ── */}
      <div className="upanel-list-card">
        <div className="upanel-list-header">
          <h3 className="upanel-list-title">Teachers</h3>
          <span className="upanel-count">
            {displayedTeachers.length}
            {isFiltered && teachers.length !== displayedTeachers.length && (
              <span className="upanel-count-total"> / {teachers.length}</span>
            )}
          </span>
        </div>

        {/* Filter bar */}
        <div className="upanel-filters">
          <div className="upanel-filter-group">
            <label className="upanel-filter-label">First Name</label>
            <input
              className="upanel-filter-input"
              type="text"
              placeholder="Search..."
              value={filterFirstName}
              onChange={(e) => setFilterFirstName(e.target.value)}
            />
          </div>
          <div className="upanel-filter-group">
            <label className="upanel-filter-label">Last Name</label>
            <input
              className="upanel-filter-input"
              type="text"
              placeholder="Search..."
              value={filterLastName}
              onChange={(e) => setFilterLastName(e.target.value)}
            />
          </div>
          <div className="upanel-filter-group">
            <label className="upanel-filter-label">Grade</label>
            <select
              className="upanel-filter-select"
              value={filterGrade}
              onChange={(e) => {
                setFilterGrade(e.target.value);
                setFilterSection("");
              }}
            >
              <option value="">All grades</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          {filterGrade && (
            <div className="upanel-filter-group">
              <label className="upanel-filter-label">Section</label>
              <select
                className="upanel-filter-select"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
              >
                <option value="">All sections</option>
                {availableSections.map((s) => (
                  <option key={s} value={s}>
                    Section {s}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="upanel-filter-group">
            <label className="upanel-filter-label">Subject</label>
            <select
              className="upanel-filter-select"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="">All subjects</option>
              {allSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="upanel-filter-group">
            <label className="upanel-filter-label">Sort: Name</label>
            <select
              className="upanel-filter-select"
              value={sortLastName}
              onChange={(e) => setSortLastName(e.target.value)}
            >
              <option value="">Default</option>
              <option value="asc">A → Z</option>
              <option value="desc">Z → A</option>
            </select>
          </div>
          {isFiltered && (
            <button
              className="btn btn-secondary btn-sm upanel-filter-clear"
              onClick={clearFilters}
            >
              Clear all filters
            </button>
          )}
        </div>

        {isLoading && <p className="upanel-loading">Loading...</p>}
        {error && <p className="upanel-error">{error.message}</p>}
        {!isLoading && displayedTeachers.length === 0 && (
          <p className="upanel-empty">
            {isFiltered
              ? "No teachers match these filters."
              : "No teachers yet."}
          </p>
        )}

        <ul className="upanel-items">
          {displayedTeachers.map((t) => (
            <li key={t.email} className="upanel-item">
              <div className="upanel-item-info">
                <span className="upanel-item-name">
                  {t.firstName} {t.lastName}
                </span>
                <span className="upanel-item-email">{t.email}</span>
                {t.speciality && (
                  <span className="upanel-item-detail">{t.speciality}</span>
                )}
                {t.assignments?.length > 0 && (
                  <span className="upanel-item-detail">
                    {t.assignments
                      .map(
                        (a) =>
                          `G${a.grade_section?.grade}·${a.grade_section?.section} (${a.subjects?.join(", ")})`,
                      )
                      .join(" | ")}
                  </span>
                )}
              </div>
              <div className="upanel-item-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setViewingTeacher(t)}
                >
                  View
                </button>
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => handleEdit(t)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(t.email)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      {viewingTeacher && (
        <UserInfoModal
          user={viewingTeacher}
          type="teacher"
          onClose={() => setViewingTeacher(null)}
        />
      )}
    </div>
  );
};

export default TeacherAdmin;
