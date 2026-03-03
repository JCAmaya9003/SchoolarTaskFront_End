/**
 * StudentAdmin — Manage students (CRUD) + client-side filters.
 * Filters: by grade → section (cascading), by last name, by date of birth.
 * Layout: form first (top), filter bar + list below.
 */
import {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { AuthContext } from "../contexts/AuthContext";
import useFetch from "../hooks/UseFetch";
import usePost from "../hooks/UsePost";
import useUpdate from "../hooks/UseUpdate";
import useDelete from "../hooks/UseDelete";
import FormInput from "./FormInput";
import * as userService from "../services/userService";
import "../assets/form.css";
import "../assets/UserPanel.css";

/* PRESERVED FOR FUTURE USE:
import { config } from "../utils/ConfigUtils";
const backUrl = config.backUrl;
*/

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",

  birth_date: "",
  roleName: "Student",
  gender: "",
  address: "",
  nationality: "",
  parent_email: "",
  grade: "",
  section: "",
  allergies: "",
  medical_conditions: "",
  emergency_contact: { firstName: "", phone: "" },
};

const StudentAdmin = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const formCardRef = useRef(null);
  const [showPwd, setShowPwd] = useState(false);

  // ── Filters ────────────────────────────────────────────────
  const [filterFirstName, setFilterFirstName] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [filterLastName, setFilterLastName] = useState("");
  const [filterDob, setFilterDob] = useState(""); // "asc" | "desc" | ""
  const [sortLastName, setSortLastName] = useState(""); // "asc" | "desc" | ""

  const fetchStudents = useCallback(
    () => userService.getStudents(user),
    [user],
  );
  const fetchParents = useCallback(() => userService.getParents(), []);

  const { data, error, isLoading, refetch } = useFetch(fetchStudents);
  const { data: parentsData } = useFetch(fetchParents);
  const { postData } = usePost();
  const { updateData } = useUpdate();
  const { deleteData } = useDelete();

  useEffect(() => {
    if (data) setStudents(data);
  }, [data]);

  const resetForm = () => {
    setEditingStudent(null);
    setFormData(emptyForm);
  };

  // ── Derived: available grades from the loaded students ─────
  const availableGrades = useMemo(() => {
    const grades = [...new Set(students.map((s) => s.grade).filter(Boolean))];
    return grades.sort((a, b) => Number(a) - Number(b));
  }, [students]);

  // ── Derived: available sections for the selected grade ─────
  const availableSections = useMemo(() => {
    if (!filterGrade) return [];
    const sections = [
      ...new Set(
        students
          .filter((s) => String(s.grade) === String(filterGrade))
          .map((s) => s.section)
          .filter(Boolean),
      ),
    ];
    return sections.sort();
  }, [students, filterGrade]);

  // ── Filtered + sorted student list ─────────────────────────
  const displayedStudents = useMemo(() => {
    let list = [...students];

    // Filter by grade
    if (filterGrade) {
      list = list.filter((s) => String(s.grade) === String(filterGrade));
      // Filter by section (only if grade is selected)
      if (filterSection) {
        list = list.filter((s) => s.section === filterSection);
      }
    }

    // Filter by first name
    if (filterFirstName.trim()) {
      const q = filterFirstName.toLowerCase();
      list = list.filter((s) => s.firstName?.toLowerCase().includes(q));
    }

    // Filter by last name
    if (filterLastName.trim()) {
      const q = filterLastName.toLowerCase();
      list = list.filter((s) => s.lastName?.toLowerCase().includes(q));
    }

    // Sort by date of birth
    if (filterDob === "asc") {
      list = list.sort(
        (a, b) => new Date(a.birth_date) - new Date(b.birth_date),
      );
    } else if (filterDob === "desc") {
      list = list.sort(
        (a, b) => new Date(b.birth_date) - new Date(a.birth_date),
      );
    }

    // Sort by last name
    if (sortLastName === "asc") {
      list = list.sort((a, b) => a.lastName?.localeCompare(b.lastName));
    } else if (sortLastName === "desc") {
      list = list.sort((a, b) => b.lastName?.localeCompare(a.lastName));
    }

    return list;
  }, [
    students,
    filterGrade,
    filterSection,
    filterFirstName,
    filterLastName,
    filterDob,
    sortLastName,
  ]);

  const clearFilters = () => {
    setFilterFirstName("");
    setFilterGrade("");
    setFilterSection("");
    setFilterLastName("");
    setFilterDob("");
    setSortLastName("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("emergency_contact")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        emergency_contact: { ...prev.emergency_contact, [field]: value },
      }));
    } else if (name === "parent_email" && value) {
      const p = parentsData?.find((p) => p.email === value);
      setFormData({
        ...formData,
        parent_email: value,
        emergency_contact: p
          ? { firstName: `${p.firstName} ${p.lastName}`, phone: p.phone || "" }
          : formData.emergency_contact,
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await updateData(
          userService.updateStudent,
          editingStudent.email,
          formData,
        );
      } else {
        await postData(userService.createStudent, formData);
      }
      resetForm();
      refetch();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleDelete = async (email) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await deleteData(userService.deleteStudent, email);
      refetch();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const handleEdit = (s) => {
    setEditingStudent(s);
    setFormData(s);
    // Scroll the form card into view so the user can edit comfortably
    setTimeout(
      () =>
        formCardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  };

  const isFiltered =
    filterFirstName ||
    filterGrade ||
    filterSection ||
    filterLastName ||
    filterDob ||
    sortLastName;

  return (
    <div className="upanel">
      {/* ── Create / Edit form (top) ── */}
      <div className="upanel-form-card" ref={formCardRef}>
        <h3 className="upanel-form-title">
          {editingStudent
            ? `Editing ${editingStudent.firstName} ${editingStudent.lastName}`
            : "Add Student"}
        </h3>
        <form onSubmit={handleSubmit}>
          <div className="upanel-row">
            <FormInput
              name="firstName"
              label="First Name"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
            <FormInput
              name="lastName"
              label="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="upanel-row">
            <FormInput
              name="email"
              label="Email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              required
              disabled={!!editingStudent}
            />
            <div className="upanel-field">
              <label className="upanel-label">
                Password{editingStudent ? " (leave blank to keep)" : " *"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  className="upanel-input"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPwd ? "text" : "password"}
                  placeholder={
                    editingStudent ? "Leave blank to keep current" : ""
                  }
                  required={!editingStudent}
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
            </div>
          </div>
          <div className="upanel-row">
            <FormInput
              name="birth_date"
              label="Date of Birth"
              value={formData.birth_date}
              onChange={handleChange}
              type="date"
              required
            />
            <FormInput
              name="nationality"
              label="Nationality"
              value={formData.nationality}
              onChange={handleChange}
              required
            />
          </div>
          <div className="upanel-row">
            <div>
              <label>Gender</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <FormInput
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              required
            />
          </div>
          <div className="upanel-row">
            <FormInput
              name="grade"
              label="Grade"
              value={formData.grade}
              onChange={handleChange}
              required
            />
            <FormInput
              name="section"
              label="Section"
              value={formData.section}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label>Parent *</label>
            {!parentsData || parentsData.length === 0 ? (
              <p className="upanel-notice">
                No parents yet — create a parent first.
              </p>
            ) : (
              <select
                name="parent_email"
                value={formData.parent_email}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select a Parent
                </option>
                {parentsData.filter(Boolean).map((p) => (
                  <option key={p.email} value={p.email}>
                    {p.firstName} {p.lastName} — {p.email}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="upanel-row">
            <FormInput
              name="allergies"
              label="Allergies"
              value={formData.allergies}
              onChange={handleChange}
            />
            <FormInput
              name="medical_conditions"
              label="Medical Conditions"
              value={formData.medical_conditions}
              onChange={handleChange}
            />
          </div>
          <p className="upanel-section-label">Emergency Contact</p>
          <div className="upanel-row">
            <FormInput
              name="emergency_contact.firstName"
              label="Contact Name"
              value={formData.emergency_contact.firstName}
              onChange={handleChange}
              required
            />
            <FormInput
              name="emergency_contact.phone"
              label="Contact Phone"
              value={formData.emergency_contact.phone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="upanel-actions">
            <button type="submit" className="btn btn-primary">
              {editingStudent ? "Update Student" : "Create Student"}
            </button>
            {editingStudent && (
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

      {/* ── Student list (bottom) ── */}
      <div className="upanel-list-card">
        <div className="upanel-list-header">
          <h3 className="upanel-list-title">Students</h3>
          <span className="upanel-count">
            {displayedStudents.length}
            {isFiltered && students.length !== displayedStudents.length && (
              <span className="upanel-count-total"> / {students.length}</span>
            )}
          </span>
        </div>

        {/* ── Filter bar ── */}
        <div className="upanel-filters">
          {/* Grade filter */}
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

          {/* Section filter — only visible when a grade is selected */}
          {filterGrade && (
            <div className="upanel-filter-group">
              <label className="upanel-filter-label">Section</label>
              <select
                className="upanel-filter-select"
                value={filterSection}
                onChange={(e) => setFilterSection(e.target.value)}
              >
                <option value="">All sections</option>
                {availableSections.map((sec) => (
                  <option key={sec} value={sec}>
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* First name search */}
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

          {/* Last name search */}
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

          {/* Sort by last name */}
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

          {/* Sort by date of birth */}
          <div className="upanel-filter-group">
            <label className="upanel-filter-label">Sort: DOB</label>
            <select
              className="upanel-filter-select"
              value={filterDob}
              onChange={(e) => setFilterDob(e.target.value)}
            >
              <option value="">Default</option>
              <option value="asc">Oldest first</option>
              <option value="desc">Youngest first</option>
            </select>
          </div>

          {/* Clear all filters */}
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
        {!isLoading && displayedStudents.length === 0 && (
          <p className="upanel-empty">
            {isFiltered
              ? "No students match these filters."
              : "No students yet."}
          </p>
        )}

        <ul className="upanel-items">
          {displayedStudents.map((s) => (
            <li key={s.email} className="upanel-item">
              <div className="upanel-item-info">
                <span className="upanel-item-name">
                  {s.firstName} {s.lastName}
                </span>
                <span className="upanel-item-email">{s.email}</span>
                {(s.grade || s.birth_date) && (
                  <span className="upanel-item-detail">
                    {s.grade &&
                      `Grade ${s.grade}${s.section ? ` · ${s.section}` : ""}`}
                    {s.grade && s.birth_date && " · "}
                    {s.birth_date &&
                      new Date(s.birth_date).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="upanel-item-actions">
                <button
                  className="btn btn-info btn-sm"
                  onClick={() => handleEdit(s)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(s.email)}
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

export default StudentAdmin;
