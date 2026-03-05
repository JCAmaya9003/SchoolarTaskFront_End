/**
 * ParentAdmin — Manage parents (CRUD) + client-side filters.
 * Filters: by first name, by last name, by student (select student → shows parent).
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
import useToast from "../hooks/useToast";
import Toast from "./Toast";
import UserInfoModal from "./UserInfoModal";
import * as userService from "../services/userService";
import "../assets/form.css";
import "../assets/UserPanel.css";

// ── Validation ───────────────────────────────────────────────
const validateParent = (fd) => {
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
  if (!fd.phone) errs.phone = "Phone number is required.";
  if (!fd.work_phone) errs.work_phone = "Work phone is required.";
  if (!fd.work_place?.trim()) errs.work_place = "Work place is required.";
  if (!fd.profession?.trim()) errs.profession = "Profession is required.";
  return errs;
};

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  birth_date: "",
  roleName: "Parent",
  gender: "",
  address: "",
  nationality: "",
  phoneDialCode: "+1",
  phone: "",
  workPhoneDialCode: "+1",
  work_phone: "",
  work_place: "",
  profession: "",
};

const ParentAdmin = () => {
  const [parents, setParents] = useState([]);
  const [students, setStudents] = useState([]);
  const [editingParent, setEditingParent] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [formKey, setFormKey] = useState(0);
  const [pendingDeleteEmail, setPendingDeleteEmail] = useState(null);
  const [viewingParent, setViewingParent] = useState(null);
  const formCardRef = useRef(null);
  const [showPwd, setShowPwd] = useState(false);
  const { toasts, showToast, dismissToast } = useToast();

  const { countries, isLoading: loadingCountries } = useCountries();

  // ── Filters ────────────────────────────────────────────────
  const [filterFirstName, setFilterFirstName] = useState("");
  const [filterLastName, setFilterLastName] = useState("");
  const [filterByStudent, setFilterByStudent] = useState(""); // student email → find their parent

  const fetchParents = useCallback(() => userService.getParents(), []);
  const fetchStudents = useCallback(() => userService.getStudents(), []);

  const { data, error, isLoading, refetch } = useFetch(fetchParents);
  const { data: studentsData } = useFetch(fetchStudents);
  const { postData } = usePost();
  const { updateData } = useUpdate();
  const { deleteData } = useDelete();

  useEffect(() => {
    if (data) setParents(data);
  }, [data]);
  useEffect(() => {
    if (studentsData) setStudents(studentsData);
  }, [studentsData]);

  const resetForm = () => {
    setEditingParent(null);
    setFormData(emptyForm);
    setFormKey((k) => k + 1);
    clearErrors();
  };

  // ── Filtered parent list ─────────────────────────────────────
  const displayedParents = useMemo(() => {
    let list = [...parents];

    if (filterFirstName.trim()) {
      const q = filterFirstName.toLowerCase();
      list = list.filter((p) => p.firstName?.toLowerCase().includes(q));
    }
    if (filterLastName.trim()) {
      const q = filterLastName.toLowerCase();
      list = list.filter((p) => p.lastName?.toLowerCase().includes(q));
    }
    if (filterByStudent) {
      // Find the parent linked to that student
      const student = students.find((s) => s.email === filterByStudent);
      if (student?.parent_email) {
        list = list.filter((p) => p.email === student.parent_email);
      } else {
        list = [];
      }
    }

    return list;
  }, [parents, students, filterFirstName, filterLastName, filterByStudent]);

  const clearFilters = () => {
    setFilterFirstName("");
    setFilterLastName("");
    setFilterByStudent("");
  };
  const isFiltered = filterFirstName || filterLastName || filterByStudent;

  // ── CRUD handlers ─────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    clearFieldError(name);
  };

  // ── Submit logic ─────────────────────────────────────────────
  const doSubmit = async (fd) => {
    // Serialize phones to '+dialCode digits' format
    const phone = fd.phone ? `${fd.phoneDialCode || "+1"} ${fd.phone}` : "";
    const work_phone = fd.work_phone
      ? `${fd.workPhoneDialCode || "+1"} ${fd.work_phone}`
      : "";
    const payload = Object.assign({}, fd, {
      phone,
      work_phone,
      phoneDialCode: undefined,
      workPhoneDialCode: undefined,
    });
    try {
      if (editingParent) {
        await updateData(
          userService.updateParent,
          editingParent.email,
          payload,
        );
        showToast(`${fd.firstName} ${fd.lastName} updated!`, "success");
      } else {
        await postData(userService.createParent, payload);
        showToast(`Parent ${fd.firstName} ${fd.lastName} created!`, "success");
      }
      resetForm();
      refetch();
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const { errors, trySubmit, clearFieldError, clearErrors } = useFormErrors(
    validateParent,
    doSubmit,
  );

  const handleDelete = async (email) => {
    // First click: flag this parent as pending-delete (shows inline confirm row)
    if (pendingDeleteEmail !== email) {
      setPendingDeleteEmail(email);
      return;
    }
    // Second click (confirmed): delete parent + any linked students
    setPendingDeleteEmail(null);
    try {
      const linkedStudents = students.filter((s) => s.parent_email === email);
      // Cascade: delete each linked student first
      for (const s of linkedStudents) {
        await deleteData(userService.deleteStudent, s.email);
      }
      await deleteData(userService.deleteParent, email);
      if (linkedStudents.length > 0) {
        showToast(
          `Parent deleted. ${linkedStudents.length} linked student(s) were also removed.`,
          "success",
        );
      } else {
        showToast("Parent deleted.", "success");
      }
      refetch();
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  const handleEdit = (p) => {
    setEditingParent(p);
    setFormData(p);
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
          {editingParent
            ? `Editing ${editingParent.firstName} ${editingParent.lastName}`
            : "Add Parent"}
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
                disabled={!!editingParent}
              />
              <FieldError message={errors.email} />
            </div>
            <div className="upanel-field">
              <label className="upanel-label">
                Password{editingParent ? " (leave blank to keep)" : " *"}
              </label>
              <div style={{ position: "relative" }}>
                <input
                  name="password"
                  className="upanel-input"
                  value={formData.password}
                  onChange={handleChange}
                  type={showPwd ? "text" : "password"}
                  placeholder={
                    editingParent ? "Leave blank to keep current" : ""
                  }
                  required={!editingParent}
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
                key={`parent-phone-${formKey}`}
                label="Phone"
                dialCode={formData.phoneDialCode}
                phone={formData.phone}
                onChange={({ dialCode, phone }) =>
                  setFormData((p) => ({ ...p, phoneDialCode: dialCode, phone }))
                }
                required
                id="parent-phone"
              />
              <FieldError message={errors.phone} />
            </div>
            <div>
              <PhoneInput
                key={`parent-work-phone-${formKey}`}
                label="Work Phone"
                dialCode={formData.workPhoneDialCode}
                phone={formData.work_phone}
                onChange={({ dialCode, phone }) =>
                  setFormData((p) => ({
                    ...p,
                    workPhoneDialCode: dialCode,
                    work_phone: phone,
                  }))
                }
                required
                id="parent-work-phone"
              />
              <FieldError message={errors.work_phone} />
            </div>
          </div>
          <div className="upanel-row">
            <div className={errors.work_place ? "field-has-error" : ""}>
              <FormInput
                name="work_place"
                label="Work Place"
                value={formData.work_place}
                onChange={handleChange}
                required
              />
              <FieldError message={errors.work_place} />
            </div>
            <div className={errors.profession ? "field-has-error" : ""}>
              <FormInput
                name="profession"
                label="Profession"
                value={formData.profession}
                onChange={handleChange}
                required
              />
              <FieldError message={errors.profession} />
            </div>
          </div>
          <div className="upanel-actions">
            <button type="submit" className="btn btn-primary">
              {editingParent ? "Update Parent" : "Create Parent"}
            </button>
            {editingParent && (
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

      {/* ── Parent list (bottom) ── */}
      <div className="upanel-list-card">
        <div className="upanel-list-header">
          <h3 className="upanel-list-title">Parents</h3>
          <span className="upanel-count">
            {displayedParents.length}
            {isFiltered && parents.length !== displayedParents.length && (
              <span className="upanel-count-total"> / {parents.length}</span>
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
            <label className="upanel-filter-label">By Student</label>
            <select
              className="upanel-filter-select"
              value={filterByStudent}
              onChange={(e) => setFilterByStudent(e.target.value)}
              style={{ minWidth: 180 }}
            >
              <option value="">All parents</option>
              {students.filter(Boolean).map((s) => (
                <option key={s.email} value={s.email}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
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
        {!isLoading && displayedParents.length === 0 && (
          <p className="upanel-empty">
            {isFiltered ? "No parents match these filters." : "No parents yet."}
          </p>
        )}

        <ul className="upanel-items">
          {displayedParents.map((p) => (
            <li key={p.email} className="upanel-item">
              <div className="upanel-item-info">
                <span className="upanel-item-name">
                  {p.firstName} {p.lastName}
                </span>
                <span className="upanel-item-email">{p.email}</span>
                {(p.profession || p.work_place) && (
                  <span className="upanel-item-detail">
                    {p.profession}
                    {p.profession && p.work_place && " · "}
                    {p.work_place}
                  </span>
                )}
              </div>
              <div className="upanel-item-actions">
                {pendingDeleteEmail === p.email ? (
                  <>
                    <span
                      style={{ fontSize: 12, color: "#B45309", marginRight: 4 }}
                    >
                      {students.some((s) => s.parent_email === p.email)
                        ? "⚠ Linked students will also be deleted!"
                        : "Confirm delete?"}
                    </span>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.email)}
                    >
                      Confirm
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPendingDeleteEmail(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setViewingParent(p)}
                    >
                      View
                    </button>
                    <button
                      className="btn btn-info btn-sm"
                      onClick={() => handleEdit(p)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.email)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
      {viewingParent && (
        <UserInfoModal
          user={viewingParent}
          type="parent"
          onClose={() => setViewingParent(null)}
        />
      )}
    </div>
  );
};

export default ParentAdmin;
