/**
 * UserInfoModal — displays all data for a student, teacher, or parent.
 *
 * Props:
 *   user      — the user object (student / teacher / parent record)
 *   type      — "student" | "teacher" | "parent"
 *   onClose   — callback to close the modal
 */
import "../assets/UserInfoModal.css";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Format a stored date string to "Month DD, YYYY" */
const fmtDate = (d) => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return d;
  }
};

/** Calculate age from a date string */
const calcAge = (d) => {
  if (!d) return null;
  const dob = new Date(d);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
};

/** Derive initials (up to 2 chars) */
const initials = (first, last) =>
  `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase();

/** Parse stored '+dialCode digits' back for display */
const displayPhone = (stored) => {
  if (!stored) return null;
  return stored.trim();
};

// ── Sub-components ────────────────────────────────────────────────────────────

const Field = ({ label, value, full = false }) => (
  <div className={`uim-field${full ? " uim-field--full" : ""}`}>
    <span className="uim-field-label">{label}</span>
    {value ? (
      <span className="uim-field-value">{value}</span>
    ) : (
      <span className="uim-field-value uim-field-value--muted">—</span>
    )}
  </div>
);

const Section = ({ title, children, fullGrid = false }) => (
  <>
    <hr className="uim-divider" />
    <div className="uim-section">
      <p className="uim-section-title">{title}</p>
      <div className={`uim-grid${fullGrid ? " uim-grid--full" : ""}`}>
        {children}
      </div>
    </div>
  </>
);

// ── Student modal body ────────────────────────────────────────────────────────
const StudentBody = ({ u }) => {
  const age = calcAge(u.birth_date);

  // Normalize emergency contacts (support both old and new format)
  const contacts =
    u.emergency_contacts?.length > 0
      ? u.emergency_contacts
      : u.emergency_contact
        ? [u.emergency_contact]
        : [];

  // Find parent record from stored data if available
  const parentEmail = u.parent_email || null;

  return (
    <>
      {/* Identity */}
      <div className="uim-section">
        <p className="uim-section-title">Identity</p>
        <div className="uim-grid">
          <Field
            label="Date of Birth"
            value={
              age != null
                ? `${fmtDate(u.birth_date)} (${age} yrs)`
                : fmtDate(u.birth_date)
            }
          />
          <Field label="Gender" value={u.gender} />
          <Field label="Nationality" value={u.nationality} />
          <Field label="Address" value={u.address} />
        </div>
      </div>

      {/* Academic */}
      <Section title="Academic">
        <Field label="Grade" value={u.grade ? `Grade ${u.grade}` : null} />
        <Field label="Section" value={u.section} />
      </Section>

      {/* Medical */}
      <Section title="Medical">
        <Field label="Allergies" value={u.allergies || null} />
        <Field
          label="Medical Conditions"
          value={u.medical_conditions || null}
        />
      </Section>

      {/* Parent */}
      <Section title="Parent / Guardian" fullGrid>
        <Field label="Parent Email" value={parentEmail} />
      </Section>

      {/* Emergency Contacts */}
      {contacts.length > 0 && (
        <>
          <hr className="uim-divider" />
          <div className="uim-section">
            <p className="uim-section-title">
              Emergency Contacts ({contacts.length})
            </p>
            <div className="uim-contacts">
              {contacts.map((c, i) => {
                const phone =
                  displayPhone(c.phone) ||
                  (c.phoneDialCode && c.phone
                    ? `${c.phoneDialCode} ${c.phone}`
                    : null);
                return (
                  <div key={i} className="uim-contact-card">
                    <div className="uim-contact-icon">👤</div>
                    <div className="uim-contact-info">
                      <span className="uim-contact-name">
                        {c.firstName || c.name || "—"}
                      </span>
                      <span className="uim-contact-phone">
                        {phone || "No phone on file"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
};

// ── Teacher modal body ────────────────────────────────────────────────────────
const TeacherBody = ({ u }) => {
  const age = calcAge(u.birth_date);
  const assignments = u.assignments || [];

  return (
    <>
      {/* Identity */}
      <div className="uim-section">
        <p className="uim-section-title">Identity</p>
        <div className="uim-grid">
          <Field
            label="Date of Birth"
            value={
              age != null
                ? `${fmtDate(u.birth_date)} (${age} yrs)`
                : fmtDate(u.birth_date)
            }
          />
          <Field label="Gender" value={u.gender} />
          <Field label="Nationality" value={u.nationality} />
          <Field label="Address" value={u.address} />
        </div>
      </div>

      {/* Contact */}
      <Section title="Contact">
        <Field label="Phone" value={displayPhone(u.phone)} />
        <Field label="Speciality" value={u.speciality} />
      </Section>

      {/* Assignments */}
      {assignments.length > 0 && (
        <>
          <hr className="uim-divider" />
          <div className="uim-section">
            <p className="uim-section-title">
              Assignments ({assignments.length})
            </p>
            <table className="uim-assignments-table">
              <thead>
                <tr>
                  <th>Grade · Section</th>
                  <th>Subjects</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => {
                  const gs = a.grade_section || {};
                  return (
                    <tr key={i}>
                      <td>
                        <span className="uim-grade-chip">
                          {gs.grade
                            ? `Grade ${gs.grade} · ${gs.section || "?"}`
                            : "—"}
                        </span>
                      </td>
                      <td>
                        {a.subjects && a.subjects.length > 0
                          ? a.subjects.join(", ")
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
};

// ── Parent modal body ─────────────────────────────────────────────────────────
const ParentBody = ({ u }) => {
  const age = calcAge(u.birth_date);

  return (
    <>
      {/* Identity */}
      <div className="uim-section">
        <p className="uim-section-title">Identity</p>
        <div className="uim-grid">
          <Field
            label="Date of Birth"
            value={
              age != null
                ? `${fmtDate(u.birth_date)} (${age} yrs)`
                : fmtDate(u.birth_date)
            }
          />
          <Field label="Gender" value={u.gender} />
          <Field label="Nationality" value={u.nationality} />
          <Field label="Address" value={u.address} />
        </div>
      </div>

      {/* Contact */}
      <Section title="Contact">
        <Field label="Phone" value={displayPhone(u.phone)} />
        <Field label="Work Phone" value={displayPhone(u.work_phone)} />
      </Section>

      {/* Professional */}
      <Section title="Professional">
        <Field label="Work Place" value={u.work_place} />
        <Field label="Profession" value={u.profession} />
      </Section>
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
const UserInfoModal = ({ user, type, onClose }) => {
  if (!user) return null;

  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  const avatarClass = `uim-avatar uim-avatar--${type}`;
  const badgeClass = `uim-role-badge uim-role-badge--${type}`;

  // Close on backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="uim-backdrop" onClick={handleBackdropClick}>
      <div className="uim-modal" role="dialog" aria-modal="true">
        {/* Header */}
        <div className="uim-header">
          <div className={avatarClass}>
            {initials(user.firstName, user.lastName)}
          </div>
          <div className="uim-header-info">
            <h2 className="uim-name">
              {user.firstName} {user.lastName}
            </h2>
            <div className="uim-meta">
              <span className="uim-email">{user.email}</span>
              <span className={badgeClass}>{typeLabel}</span>
            </div>
          </div>
          <button className="uim-close" onClick={onClose} aria-label="Close">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="uim-body">
          {type === "student" && <StudentBody u={user} />}
          {type === "teacher" && <TeacherBody u={user} />}
          {type === "parent" && <ParentBody u={user} />}
        </div>

        {/* Footer */}
        <div className="uim-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserInfoModal;
