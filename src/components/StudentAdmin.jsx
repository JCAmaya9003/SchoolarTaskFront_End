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
import useCountries from "../hooks/useCountries";
import useToast from "../hooks/useToast";
import useFormErrors from "../hooks/useFormErrors";
import FormInput from "./FormInput";
import PhoneInput from "./PhoneInput";
import FieldError from "./FieldError";
import Toast from "./Toast";
import ParentPickerModal from "./ParentPickerModal";
import * as userService from "../services/userService";
import * as storageService from "../services/storageService";
import { STORAGE_KEYS } from "../config/appConfig";
import "../assets/form.css";
import "../assets/UserPanel.css";
import UserInfoModal from "./UserInfoModal";

const emptyContact = () => ({ firstName: "", phone: "", phoneDialCode: "+1" });

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
  emergency_contacts: [emptyContact()],
};

// Parse stored '+dialCode digits' format back to { dialCode, rawPhone }
const parseStoredPhone = (stored) => {
  if (!stored) return { dialCode: "+1", rawPhone: "" };
  const trimmed = stored.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx > 0 && trimmed.startsWith("+"))
    return {
      dialCode: trimmed.slice(0, spaceIdx),
      rawPhone: trimmed.slice(spaceIdx + 1).replace(/\D/g, ""),
    };
  return { dialCode: "+1", rawPhone: trimmed.replace(/\D/g, "") };
};

// ── Validation ────────────────────────────────────────────────────
const validateStudent = (fd) => {
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
  if (!fd.address?.trim()) errs.address = "Address is required.";
  if (!fd.grade) errs.grade = "Please select a grade.";
  if (!fd.section) errs.section = "Please select a section.";
  if (!fd.nationality) errs.nationality = "Nationality is required.";
  // Emergency contacts
  fd.emergency_contacts.forEach((c, i) => {
    if (!c.firstName.trim())
      errs[`ec_name_${i}`] = `Contact ${i + 1}: name is required.`;
    if (!c.phone)
      errs[`ec_phone_${i}`] = `Contact ${i + 1}: phone is required.`;
  });
  return errs;
};

const StudentAdmin = () => {
  const { user } = useContext(AuthContext);
  const [students, setStudents] = useState([]);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0); // increments on reset to remount PhoneInputs
  const [gradeSections, setGradeSections] = useState([]);
  const [showParentModal, setShowParentModal] = useState(false);
  const [viewingStudent, setViewingStudent] = useState(null);
  const formCardRef = useRef(null);
  const [showPwd, setShowPwd] = useState(false);
  const { countries, isLoading: loadingCountries } = useCountries();
  const { toasts, showToast, dismissToast } = useToast();

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

  // Load grade sections from storage on mount
  useEffect(() => {
    const sections = storageService.getItem(STORAGE_KEYS.GRADE_SECTIONS) || [];
    setGradeSections(sections);
  }, []);

  // Set default nationality to United States when countries load
  useEffect(() => {
    if (countries.length > 0 && !formData.nationality) {
      const us = countries.find((c) => c.code === "US");
      if (us) setFormData((prev) => ({ ...prev, nationality: us.name }));
    }
  }, [countries]); // eslint-disable-line react-hooks/exhaustive-deps

  const resetForm = () => {
    setEditingStudent(null);
    setFormData(emptyForm);
    setFormKey((k) => k + 1); // remount PhoneInputs to clear touched state
    clearErrors();
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
    clearFieldError(name);
    if (name === "parent_email" && value) {
      const p = parentsData?.find((p) => p.email === value);
      if (p) {
        // Parse stored phone '+1 1234567890' → { dialCode, rawPhone }
        const { dialCode, rawPhone } = parseStoredPhone(p.phone || "");
        setFormData((prev) => ({
          ...prev,
          parent_email: value,
          emergency_contacts: [
            {
              firstName: `${p.firstName} ${p.lastName}`,
              phone: rawPhone,
              phoneDialCode: dialCode,
            },
            ...prev.emergency_contacts.slice(1),
          ],
        }));
        setFormKey((k) => k + 1); // remount first PhoneInput with new dial code
      } else {
        setFormData((prev) => ({ ...prev, parent_email: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const updateContact = (idx, field, val) => {
    clearFieldError(`ec_${field}_${idx}`);
    setFormData((prev) => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts.map((c, i) =>
        i === idx ? { ...c, [field]: val } : c,
      ),
    }));
  };

  const addContact = () =>
    setFormData((prev) => ({
      ...prev,
      emergency_contacts: [...prev.emergency_contacts, emptyContact()],
    }));

  const removeContact = (idx) =>
    setFormData((prev) => ({
      ...prev,
      emergency_contacts: prev.emergency_contacts.filter((_, i) => i !== idx),
    }));

  // ── Submit logic ─────────────────────────────────────────────
  const doSubmit = async (fd) => {
    // Serialize each contact's phone to '+dialCode digits'
    const emergency_contacts = fd.emergency_contacts.map((c) => ({
      firstName: c.firstName,
      phone: c.phone ? `${c.phoneDialCode || "+1"} ${c.phone}` : null,
    }));
    const payload = {
      ...fd,
      allergies: fd.allergies?.trim() || null,
      medical_conditions: fd.medical_conditions?.trim() || null,
      emergency_contacts,
      emergency_contact: emergency_contacts[0] ?? null, // backwards compat
    };
    try {
      if (editingStudent) {
        await updateData(
          userService.updateStudent,
          editingStudent.email,
          payload,
        );
        showToast(`${fd.firstName} ${fd.lastName} updated!`, "success");
      } else {
        await postData(userService.createStudent, payload);
        showToast(`Student ${fd.firstName} ${fd.lastName} created!`, "success");
      }
      resetForm();
      refetch();
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const { errors, trySubmit, clearFieldError, clearErrors } = useFormErrors(
    validateStudent,
    doSubmit,
  );

  const handleDelete = async (email) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      await deleteData(userService.deleteStudent, email);
      showToast("Student deleted", "success");
      refetch();
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleEdit = (s) => {
    setEditingStudent(s);

    // Normalize: existing students may have emergency_contact (single obj) or
    // emergency_contacts (array). Map both into the array format used by the form.
    const rawContacts =
      s.emergency_contacts?.length > 0
        ? s.emergency_contacts
        : s.emergency_contact
          ? [s.emergency_contact]
          : [];

    const emergency_contacts =
      rawContacts.length > 0
        ? rawContacts.map((c) => {
            const { dialCode, rawPhone } = parseStoredPhone(c.phone || "");
            return {
              firstName: c.firstName || c.name || "",
              phone: rawPhone,
              phoneDialCode: dialCode,
            };
          })
        : [emptyContact()];

    setFormData({
      ...s,
      emergency_contacts,
      password: "", // never pre-fill password
    });
    setFormKey((k) => k + 1); // remount PhoneInputs with correct dial codes
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
                disabled={!!editingStudent}
              />
              <FieldError message={errors.email} />
            </div>
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
                disabled={loadingCountries}
              >
                <option value="" disabled>
                  {loadingCountries
                    ? "Loading countries…"
                    : "Select nationality"}
                </option>
                {countries.map((c) => (
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
            <div
              className={
                errors.grade ? "upanel-field field-has-error" : "upanel-field"
              }
            >
              <label className="upanel-label">Grade *</label>
              <select
                name="grade"
                className="upanel-input"
                value={formData.grade}
                onChange={(e) => {
                  clearFieldError("grade");
                  setFormData((prev) => ({
                    ...prev,
                    grade: e.target.value,
                    section: "",
                  }));
                }}
              >
                <option value="">Select grade…</option>
                {[...new Set(gradeSections.map((gs) => gs.grade))]
                  .sort((a, b) => Number(a) - Number(b))
                  .map((g) => (
                    <option key={g} value={g}>
                      Grade {g}
                    </option>
                  ))}
              </select>
              {gradeSections.length === 0 && (
                <p style={{ fontSize: 11, color: "#D97706", marginTop: 4 }}>
                  No grade sections configured yet — create one in Manage Grades
                  first.
                </p>
              )}
              <FieldError message={errors.grade} />
            </div>
            <div
              className={
                errors.section ? "upanel-field field-has-error" : "upanel-field"
              }
            >
              <label className="upanel-label">Section *</label>
              <select
                name="section"
                className="upanel-input"
                value={formData.section}
                onChange={(e) => {
                  clearFieldError("section");
                  setFormData((prev) => ({ ...prev, section: e.target.value }));
                }}
                disabled={!formData.grade}
              >
                <option value="">
                  {formData.grade ? "Select section…" : "Select grade first"}
                </option>
                {gradeSections
                  .filter((gs) => String(gs.grade) === String(formData.grade))
                  .map((gs) => (
                    <option key={gs.section} value={gs.section}>
                      Section {gs.section}
                    </option>
                  ))}
              </select>
              <FieldError message={errors.section} />
            </div>
          </div>
          {/* ── Parent Picker ── */}
          <div className="upanel-field">
            <label className="upanel-label">Parent *</label>
            {formData.parent_email ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: 13, color: "#334155" }}>
                  {parentsData?.find((p) => p.email === formData.parent_email)
                    ? (() => {
                        const p = parentsData.find(
                          (p) => p.email === formData.parent_email,
                        );
                        return `${p.firstName} ${p.lastName} (${p.email})`;
                      })()
                    : formData.parent_email}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowParentModal(true)}
                >
                  Change
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setFormData((p) => ({
                      ...p,
                      parent_email: "",
                      emergency_contacts: [emptyContact()],
                    }));
                    setFormKey((k) => k + 1);
                  }}
                >
                  Clear
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowParentModal(true)}
              >
                Assign Parent…
              </button>
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
          {/* ── Emergency Contacts (array) ── */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
            }}
          >
            <p className="upanel-section-label" style={{ margin: 0 }}>
              Emergency Contacts *
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={addContact}
            >
              + Add Contact
            </button>
          </div>
          {formData.emergency_contacts.map((contact, idx) => (
            <div
              key={idx}
              className="upanel-assignment-card"
              style={{ marginTop: 8 }}
            >
              <div className="upanel-assignment-header">
                <span className="upanel-assignment-title">
                  Contact {idx + 1}
                </span>
                {formData.emergency_contacts.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeContact(idx)}
                  >
                    Remove
                  </button>
                )}
              </div>
              <div className="upanel-row">
                <div
                  className={errors[`ec_name_${idx}`] ? "field-has-error" : ""}
                >
                  <FormInput
                    name={`ec_name_${idx}`}
                    label="Contact Name"
                    value={contact.firstName}
                    onChange={(e) =>
                      updateContact(idx, "firstName", e.target.value)
                    }
                    required
                  />
                  <FieldError message={errors[`ec_name_${idx}`]} />
                </div>
                <div>
                  <PhoneInput
                    key={`${formKey}-ec-${idx}`}
                    label="Contact Phone"
                    dialCode={contact.phoneDialCode}
                    phone={contact.phone}
                    onChange={({ dialCode, phone }) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergency_contacts: prev.emergency_contacts.map(
                          (c, i) =>
                            i === idx
                              ? { ...c, phone, phoneDialCode: dialCode }
                              : c,
                        ),
                      }))
                    }
                    required
                    id={`student-ec-phone-${idx}`}
                  />
                  <FieldError message={errors[`ec_phone_${idx}`]} />
                </div>
              </div>
            </div>
          ))}
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
                  className="btn btn-secondary btn-sm"
                  onClick={() => setViewingStudent(s)}
                >
                  View
                </button>
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

      {/* ── Student info modal ── */}
      {viewingStudent && (
        <UserInfoModal
          user={viewingStudent}
          type="student"
          onClose={() => setViewingStudent(null)}
        />
      )}

      {/* ── Parent picker modal ── */}
      {showParentModal && (
        <ParentPickerModal
          parents={parentsData || []}
          onSelect={(p) => {
            const { dialCode, rawPhone } = parseStoredPhone(p.phone || "");
            setFormData((prev) => ({
              ...prev,
              parent_email: p.email,
              // Auto-fill address from parent
              address: p.address || prev.address,
              // First emergency contact = parent info with parsed phone
              emergency_contacts: [
                {
                  firstName: `${p.firstName} ${p.lastName}`,
                  phone: rawPhone,
                  phoneDialCode: dialCode,
                },
                ...prev.emergency_contacts.slice(1),
              ],
            }));
            setFormKey((k) => k + 1); // remount PhoneInput with correct dial code
            setShowParentModal(false);
          }}
          onClose={() => setShowParentModal(false)}
        />
      )}

      <Toast toasts={toasts} dismissToast={dismissToast} />
    </div>
  );
};

export default StudentAdmin;
