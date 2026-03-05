/**
 * ReservationAdmin Component
 *
 * Role-based reservation management with admin-only extras:
 *   • Places tab: create / edit / delete / toggle availability
 *     Each place has its own allowed hours + blocked weekdays.
 *
 * ADMIN: All reservations, places management, per-place restrictions.
 * TEACHER: Create/edit/delete own reservations.
 * STUDENT: Create/edit/delete own reservations.
 * PARENT: View-only.
 */

import { useState, useEffect, useRef } from "react";
import * as reservationService from "../services/reservationService";
import { DEFAULT_PLACE_RESTRICTIONS } from "../services/reservationService";
import * as authService from "../services/authService";
import useFormErrors from "../hooks/useFormErrors";
import FieldError from "./FieldError";
import "../assets/Reservations.css";
import "../assets/form.css";

// ── Validation ───────────────────────────────────────────────
const validateReservation = (f) => {
  const errs = {};
  if (!f.place) errs.place = "Please select a place.";
  if (!f.start_date) errs.start_date = "Start date/time is required.";
  if (!f.end_date) errs.end_date = "End date/time is required.";
  else if (f.start_date && new Date(f.end_date) <= new Date(f.start_date))
    errs.end_date = "End must be after start.";
  return errs;
};

const validatePlace = (p) => {
  const errs = {};
  if (!p.place.trim()) errs.place = "Place name is required.";
  const cap = Number(p.capacity);
  if (!p.capacity && p.capacity !== 0) errs.capacity = "Capacity is required.";
  else if (!Number.isInteger(cap) || cap < 1)
    errs.capacity = "Capacity must be a whole number ≥ 1.";
  if (!p.type) errs.type = "Please select a place type.";
  return errs;
};

// ─── helpers ─────────────────────────────────────────────────
const fmt = (isoStr) => {
  if (!isoStr) return "—";
  return new Date(isoStr).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toLocalInput = (isoStr) => {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const blankForm = { place: "", description: "", start_date: "", end_date: "" };
const MAX_DESC = 1000;

const blankPlace = {
  place: "",
  capacity: "",
  type: "",
  unavailable: false,
  restrictions: { ...DEFAULT_PLACE_RESTRICTIONS },
};

// Time string → { hour, minute }
const parseTime = (val) => {
  const [h, m] = val.split(":").map(Number);
  return { hour: h, minute: m };
};
const fmtRestrTime = (h, m) =>
  `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

// ─────────────────────────────────────────────────────────────
const ReservationAdmin = () => {
  const currentUser = authService.getCurrentUser();
  const role = currentUser?.role;
  const isAdmin = role === "admin";
  const isReadOnly = role === "parent";
  const canManage = !isReadOnly;

  // ── Global state ──────────────────────────────────────────
  const [places, setPlaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Admin tab ─────────────────────────────────────────────
  const [adminTab, setAdminTab] = useState("reservations"); // "reservations" | "places"

  // ── Reservation form ──────────────────────────────────────
  const [form, setForm] = useState(blankForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState("");
  const formRef = useRef(null);

  // ── Reservation filters ───────────────────────────────────
  const [filterPlace, setFilterPlace] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // ── Place management ──────────────────────────────────────
  const [placeForm, setPlaceForm] = useState(blankPlace);
  const [editingPlace, setEditingPlace] = useState(null);
  const [placeError, setPlaceError] = useState("");
  const [placeFormVisible, setPlaceFormVisible] = useState(false);

  // ── load ──────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [ps, rs] = await Promise.all([
        reservationService.getAcademicPlaces(),
        reservationService.getAllReservations(),
      ]);
      setPlaces(ps);
      setReservations(rs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived ───────────────────────────────────────────────
  const displayed = reservations.filter((r) => {
    if (filterPlace && (r.place?._id || r.place) !== filterPlace) return false;
    if (filterUser && r.userEmail !== filterUser) return false;
    if (showOnlyMine && r.userEmail !== currentUser?.email) return false;
    return true;
  });
  const uniqueUsers = isAdmin
    ? [...new Set(reservations.map((r) => r.userEmail))]
    : [];

  // ── Reservation handlers ──────────────────────────────────
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    clearResFieldError(e.target.name);
    setFormError("");
  };

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm);
    setFormError("");
    setShowForm(true);
  };
  const openEdit = (res) => {
    setEditing(res);
    setForm({
      place: res.place?._id || res.place || "",
      description: res.description || "",
      start_date: toLocalInput(res.start_date),
      end_date: toLocalInput(res.end_date),
    });
    setFormError("");
    setShowForm(true);
    setTimeout(
      () =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      60,
    );
  };
  const cancelForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(blankForm);
    setFormError("");
    clearResErrors();
  };

  // ── Reservation submit logic ───────────────────────────────
  const doReservationSubmit = async (f) => {
    setFormError("");
    try {
      if (editing) await reservationService.updateReservation(editing._id, f);
      else await reservationService.createReservation(f);
      cancelForm();
      await load();
    } catch (e) {
      setFormError(e.message);
    }
  };

  const {
    errors: resErrors,
    trySubmit: tryResSubmit,
    clearFieldError: clearResFieldError,
    clearErrors: clearResErrors,
  } = useFormErrors(validateReservation, doReservationSubmit);

  const handleDelete = async (res) => {
    if (!window.confirm(`Delete reservation for "${res.place?.place}"?`))
      return;
    try {
      await reservationService.deleteReservation(res._id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const canEdit = (res) => isAdmin || res.userEmail === currentUser?.email;

  // ── Place handlers ────────────────────────────────────────
  const openPlaceCreate = () => {
    setEditingPlace(null);
    setPlaceForm({
      ...blankPlace,
      restrictions: { ...DEFAULT_PLACE_RESTRICTIONS },
    });
    setPlaceError("");
    setPlaceFormVisible(true);
  };
  const openPlaceEdit = (p) => {
    setEditingPlace(p);
    setPlaceForm({
      place: p.place,
      capacity: p.capacity,
      type: p.type || "",
      unavailable: p.unavailable || false,
      restrictions: { ...(p.restrictions || DEFAULT_PLACE_RESTRICTIONS) },
    });
    setPlaceError("");
    setPlaceFormVisible(true);
  };
  const cancelPlaceForm = () => {
    setPlaceFormVisible(false);
    setEditingPlace(null);
    setPlaceForm(blankPlace);
    setPlaceError("");
    clearPlaceErrors();
  };

  const setPlaceRestriction = (field, value) => {
    setPlaceForm((prev) => ({
      ...prev,
      restrictions: { ...prev.restrictions, [field]: value },
    }));
  };

  const toggleBlockedDay = (day) => {
    setPlaceForm((prev) => {
      const blocked = prev.restrictions.blockedWeekdays.includes(day)
        ? prev.restrictions.blockedWeekdays.filter((d) => d !== day)
        : [...prev.restrictions.blockedWeekdays, day];
      return {
        ...prev,
        restrictions: { ...prev.restrictions, blockedWeekdays: blocked },
      };
    });
  };

  // ── Place submit logic ──────────────────────────────────
  const doPlaceSubmit = async (p) => {
    setPlaceError("");
    try {
      if (editingPlace)
        await reservationService.updateAcademicPlace(editingPlace._id, p);
      else await reservationService.createAcademicPlace(p);
      cancelPlaceForm();
      await load();
    } catch (e) {
      setPlaceError(e.message);
    }
  };

  const {
    errors: placeErrors,
    trySubmit: tryPlaceSubmit,
    clearFieldError: clearPlaceFieldError,
    clearErrors: clearPlaceErrors,
  } = useFormErrors(validatePlace, doPlaceSubmit);

  const handlePlaceDelete = async (p) => {
    if (
      !window.confirm(
        `Delete "${p.place}"? Linked reservations remain but this place won't be selectable.`,
      )
    )
      return;
    try {
      await reservationService.deleteAcademicPlace(p._id);
      await load();
    } catch (e) {
      setPlaceError(e.message);
    }
  };

  const handleToggleAvailability = async (p) => {
    const becomingUnavailable = !p.unavailable;
    try {
      await reservationService.updateAcademicPlace(p._id, {
        ...p,
        unavailable: becomingUnavailable,
      });
      if (becomingUnavailable) {
        const { cancelled } = reservationService.cancelReservationsForPlace(
          p._id,
        );
        if (cancelled > 0) {
          setError(
            `"${p.place}" disabled — ${cancelled} reservation${cancelled !== 1 ? "s" : ""} cancelled.`,
          );
          setTimeout(() => setError(""), 5000);
        }
      } else {
        // Re-enabling: restore reservations that were system-cancelled for this place
        const { restored } = reservationService.restoreReservationsForPlace(
          p._id,
        );
        if (restored > 0) {
          setError(
            `"${p.place}" enabled — ${restored} reservation${restored !== 1 ? "s" : ""} restored.`,
          );
          setTimeout(() => setError(""), 5000);
        }
      }
      await load();
    } catch (e) {
      setPlaceError(e.message);
    }
  };

  // ═══════════════════════════════════ RENDER ══════════════════
  return (
    <div className="res-page">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="res-header">
        <div>
          <h2 className="res-title">Reservations</h2>
          <p className="res-subtitle">
            {isAdmin
              ? "Manage all academic place reservations"
              : isReadOnly
                ? "View upcoming reservations"
                : "Manage your reservations"}
          </p>
        </div>
        {canManage && !showForm && adminTab === "reservations" && (
          <button className="res-btn res-btn--primary" onClick={openCreate}>
            + New Reservation
          </button>
        )}
      </div>

      {/* ── Admin sub-tabs ─────────────────────────────────── */}
      {isAdmin && (
        <div className="res-subtabs">
          {[
            { id: "reservations", label: "Reservations" },
            { id: "places", label: "Places & Restrictions" },
          ].map((t) => (
            <button
              key={t.id}
              className={`res-subtab${adminTab === t.id ? " res-subtab--active" : ""}`}
              onClick={() => setAdminTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="res-error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* ══════════════════ RESERVATIONS TAB ════════════════ */}
      {adminTab === "reservations" && (
        <>
          {/* Reservation form */}
          {showForm && (
            <div className="res-form-card" ref={formRef}>
              <h3 className="res-form-title">
                {editing ? "Edit Reservation" : "New Reservation"}
              </h3>
              {formError && <div className="res-error">{formError}</div>}
              <form
                onSubmit={(e) => tryResSubmit(e, form)}
                className="res-form"
                noValidate
              >
                <div
                  className={
                    resErrors.place ? "res-field field-has-error" : "res-field"
                  }
                >
                  <label className="res-label" htmlFor="res-place">
                    Place
                  </label>
                  <select
                    id="res-place"
                    name="place"
                    className="res-select"
                    value={form.place}
                    onChange={handleChange}
                  >
                    <option value="">Select a place…</option>
                    {places
                      .filter((p) => !p.unavailable)
                      .map((p) => {
                        const r = p.restrictions || DEFAULT_PLACE_RESTRICTIONS;
                        return (
                          <option key={p._id} value={p._id}>
                            {p.place} (cap. {p.capacity}) —{" "}
                            {fmtRestrTime(
                              r.allowedStartHour,
                              r.allowedStartMinute,
                            )}
                            –
                            {fmtRestrTime(r.allowedEndHour, r.allowedEndMinute)}
                          </option>
                        );
                      })}
                  </select>
                  <FieldError message={resErrors.place} />
                </div>

                {/* Show selected place's restrictions as a hint */}
                {form.place &&
                  (() => {
                    const sel = places.find((p) => p._id === form.place);
                    const r = sel?.restrictions || DEFAULT_PLACE_RESTRICTIONS;
                    return (
                      <p className="res-hint">
                        Allowed:{" "}
                        {fmtRestrTime(r.allowedStartHour, r.allowedStartMinute)}
                        -{fmtRestrTime(r.allowedEndHour, r.allowedEndMinute)}
                        {r.blockedWeekdays.length > 0 && (
                          <>
                            {" "}
                            · Blocked:{" "}
                            {r.blockedWeekdays
                              .map((d) => DAY_NAMES[d])
                              .join(", ")}
                          </>
                        )}
                      </p>
                    );
                  })()}

                <div className="res-field">
                  <label
                    className="res-label"
                    htmlFor="res-desc"
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                    }}
                  >
                    Description
                    <span
                      style={{
                        fontSize: 11,
                        color:
                          MAX_DESC - form.description.length < 100
                            ? "#DC2626"
                            : "#94A3B8",
                        fontWeight: 400,
                      }}
                    >
                      {MAX_DESC - form.description.length} / {MAX_DESC} left
                    </span>
                  </label>
                  <textarea
                    id="res-desc"
                    name="description"
                    className="res-textarea"
                    value={form.description}
                    onChange={handleChange}
                    maxLength={MAX_DESC}
                    placeholder="Purpose of the reservation…"
                    required
                    style={{
                      resize: "none",
                      fontFamily: "inherit",
                      height: 100,
                    }}
                  />
                </div>
                <div className="res-row">
                  <div
                    className={
                      resErrors.start_date
                        ? "res-field field-has-error"
                        : "res-field"
                    }
                  >
                    <label className="res-label" htmlFor="res-start">
                      Start
                    </label>
                    <input
                      id="res-start"
                      name="start_date"
                      type="datetime-local"
                      className="res-input"
                      value={form.start_date}
                      onChange={handleChange}
                    />
                    <FieldError message={resErrors.start_date} />
                  </div>
                  <div
                    className={
                      resErrors.end_date
                        ? "res-field field-has-error"
                        : "res-field"
                    }
                  >
                    <label className="res-label" htmlFor="res-end">
                      End
                    </label>
                    <input
                      id="res-end"
                      name="end_date"
                      type="datetime-local"
                      className="res-input"
                      value={form.end_date}
                      onChange={handleChange}
                    />
                    <FieldError message={resErrors.end_date} />
                  </div>
                </div>
                <div className="res-form-actions">
                  <button type="submit" className="res-btn res-btn--primary">
                    {editing ? "Save Changes" : "Create"}
                  </button>
                  <button
                    type="button"
                    className="res-btn res-btn--ghost"
                    onClick={cancelForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filters */}
          {!showForm && reservations.length > 0 && (
            <div className="res-filters">
              <select
                className="res-select res-select--sm"
                value={filterPlace}
                onChange={(e) => setFilterPlace(e.target.value)}
              >
                <option value="">All places</option>
                {places.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.place}
                  </option>
                ))}
              </select>
              {isAdmin && (
                <select
                  className="res-select res-select--sm"
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                >
                  <option value="">All users</option>
                  {uniqueUsers.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              )}
              {!isAdmin && canManage && (
                <button
                  className={`res-btn res-btn--sm ${showOnlyMine ? "res-btn--primary" : "res-btn--ghost"}`}
                  onClick={() => setShowOnlyMine((v) => !v)}
                >
                  {showOnlyMine ? "My reservations" : "Show only mine"}
                </button>
              )}
              {(filterPlace || filterUser || showOnlyMine) && (
                <button
                  className="res-btn res-btn--ghost res-btn--sm"
                  onClick={() => {
                    setFilterPlace("");
                    setFilterUser("");
                    setShowOnlyMine(false);
                  }}
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* List */}
          {loading ? (
            <p className="res-loading">Loading reservations…</p>
          ) : displayed.length === 0 ? (
            <div className="res-empty">
              <p>No reservations found.</p>
              {canManage && (
                <button
                  className="res-btn res-btn--primary"
                  onClick={openCreate}
                >
                  Create your first reservation
                </button>
              )}
            </div>
          ) : (
            <div className="res-list">
              {displayed.map((res) => {
                const isPast = new Date(res.end_date) < new Date();
                return (
                  <div
                    key={res._id}
                    className={`res-card ${
                      res.status === "cancelled"
                        ? "res-card--cancelled"
                        : isPast
                          ? "res-card--past"
                          : "res-card--upcoming"
                    }`}
                  >
                    <div className="res-card-left">
                      <span className="res-place-badge">
                        {res.place?.place || res.place}
                      </span>
                      <p className="res-description">{res.description}</p>
                      <div className="res-times">
                        <span>{fmt(res.start_date)}</span>
                        <span className="res-arrow">→</span>
                        <span>{fmt(res.end_date)}</span>
                      </div>
                      {isAdmin && (
                        <span className="res-user-tag">{res.userEmail}</span>
                      )}
                      {!isAdmin && res.userEmail === currentUser?.email && (
                        <span className="res-mine-tag">✓ Yours</span>
                      )}
                    </div>
                    <div className="res-card-right">
                      <span
                        className={`res-status ${
                          res.status === "cancelled"
                            ? "res-status--cancelled"
                            : isPast
                              ? "res-status--past"
                              : "res-status--upcoming"
                        }`}
                      >
                        {res.status === "cancelled"
                          ? `Cancelled${res.cancelReason ? ` — ${res.cancelReason}` : ""}`
                          : isPast
                            ? "Past"
                            : "Upcoming"}
                      </span>
                      {canEdit(res) &&
                        !isReadOnly &&
                        res.status !== "cancelled" && (
                          <div className="res-actions">
                            <button
                              className="res-btn res-btn--sm res-btn--ghost"
                              onClick={() => openEdit(res)}
                            >
                              Edit
                            </button>
                            <button
                              className="res-btn res-btn--sm res-btn--danger"
                              onClick={() => handleDelete(res)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ══════════════════ PLACES TAB (admin only) ═════════ */}
      {isAdmin && adminTab === "places" && (
        <div className="res-admin-panel">
          <div className="res-panel-header">
            <h3 className="res-panel-title">Places & Restrictions</h3>
            {!placeFormVisible && (
              <button
                className="res-btn res-btn--primary"
                onClick={openPlaceCreate}
              >
                + Add Place
              </button>
            )}
          </div>

          {placeError && <div className="res-error">{placeError}</div>}

          {/* Place form */}
          {placeFormVisible && (
            <div className="res-form-card">
              <h3 className="res-form-title">
                {editingPlace ? "Edit Place" : "New Place"}
              </h3>
              <form
                onSubmit={(e) => tryPlaceSubmit(e, placeForm)}
                className="res-form"
                noValidate
              >
                {/* Basic info */}
                <div className="res-row">
                  <div
                    className={
                      placeErrors.place
                        ? "res-field field-has-error"
                        : "res-field"
                    }
                  >
                    <label className="res-label">Name *</label>
                    <input
                      className="res-input"
                      value={placeForm.place}
                      onChange={(e) => {
                        setPlaceForm({ ...placeForm, place: e.target.value });
                        clearPlaceFieldError("place");
                      }}
                      placeholder="e.g. Library, Science Lab…"
                    />
                    <FieldError message={placeErrors.place} />
                  </div>
                  <div
                    className={
                      placeErrors.capacity
                        ? "res-field field-has-error"
                        : "res-field"
                    }
                  >
                    <label className="res-label">Capacity *</label>
                    <input
                      className="res-input"
                      type="number"
                      min="1"
                      value={placeForm.capacity}
                      onChange={(e) => {
                        setPlaceForm({
                          ...placeForm,
                          capacity: e.target.value,
                        });
                        clearPlaceFieldError("capacity");
                      }}
                      placeholder="e.g. 30"
                    />
                    <FieldError message={placeErrors.capacity} />
                  </div>
                </div>
                <div className="res-row">
                  <div
                    className={
                      placeErrors.type
                        ? "res-field field-has-error"
                        : "res-field"
                    }
                  >
                    <label className="res-label">Type *</label>
                    <input
                      className="res-input"
                      value={placeForm.type}
                      onChange={(e) => {
                        setPlaceForm({ ...placeForm, type: e.target.value });
                        clearPlaceFieldError("type");
                      }}
                      placeholder="e.g. Lab, Classroom, Hall…"
                    />
                    <FieldError message={placeErrors.type} />
                  </div>
                  <div className="res-field">
                    <label className="res-label">Status</label>
                    <label className="res-toggle">
                      <input
                        type="checkbox"
                        checked={placeForm.unavailable}
                        onChange={(e) =>
                          setPlaceForm({
                            ...placeForm,
                            unavailable: e.target.checked,
                          })
                        }
                      />
                      <span className="res-toggle-track" />
                      <span
                        style={{
                          fontSize: 12,
                          color: placeForm.unavailable ? "#B91C1C" : "#065F46",
                          fontWeight: 600,
                        }}
                      >
                        {placeForm.unavailable ? "Unavailable" : "Available"}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Per-place restrictions */}
                <div className="res-restrict-card">
                  <h4 className="res-restrict-title">
                    Allowed Time Range for this Place
                  </h4>
                  <div className="res-row">
                    <div className="res-field">
                      <label className="res-label">Earliest start</label>
                      <input
                        type="time"
                        className="res-input"
                        value={fmtRestrTime(
                          placeForm.restrictions.allowedStartHour,
                          placeForm.restrictions.allowedStartMinute,
                        )}
                        onChange={(e) => {
                          const { hour: h, minute: m } = parseTime(
                            e.target.value,
                          );
                          setPlaceRestriction("allowedStartHour", h);
                          setPlaceRestriction("allowedStartMinute", m);
                        }}
                      />
                    </div>
                    <div className="res-field">
                      <label className="res-label">Latest end</label>
                      <input
                        type="time"
                        className="res-input"
                        value={fmtRestrTime(
                          placeForm.restrictions.allowedEndHour,
                          placeForm.restrictions.allowedEndMinute,
                        )}
                        onChange={(e) => {
                          const { hour: h, minute: m } = parseTime(
                            e.target.value,
                          );
                          setPlaceRestriction("allowedEndHour", h);
                          setPlaceRestriction("allowedEndMinute", m);
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      className="res-label"
                      style={{ marginBottom: 8, display: "block" }}
                    >
                      Blocked Days
                    </label>
                    <p className="res-hint" style={{ marginBottom: 8 }}>
                      Click a day to block/unblock it for this place.
                    </p>
                    <div className="res-day-grid">
                      {DAY_NAMES.map((name, idx) => (
                        <label
                          key={idx}
                          className={`res-day-chip${placeForm.restrictions.blockedWeekdays.includes(idx) ? " res-day-chip--blocked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            style={{ display: "none" }}
                            checked={placeForm.restrictions.blockedWeekdays.includes(
                              idx,
                            )}
                            onChange={() => toggleBlockedDay(idx)}
                          />
                          {name.slice(0, 3)}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="res-form-actions">
                  <button type="submit" className="res-btn res-btn--primary">
                    {editingPlace ? "Save Changes" : "Create Place"}
                  </button>
                  <button
                    type="button"
                    className="res-btn res-btn--ghost"
                    onClick={cancelPlaceForm}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Places list */}
          {loading ? (
            <p className="res-loading">Loading…</p>
          ) : places.length === 0 ? (
            <div className="res-empty">
              <p>No places yet. Add one to allow reservations.</p>
            </div>
          ) : (
            <div className="res-list">
              {places.map((p) => {
                const r = p.restrictions || DEFAULT_PLACE_RESTRICTIONS;
                return (
                  <div
                    key={p._id}
                    className={`res-card ${p.unavailable ? "res-card--past" : "res-card--upcoming"}`}
                  >
                    <div className="res-card-left">
                      <span className="res-place-badge">{p.place}</span>
                      <p className="res-description">
                        Capacity: {p.capacity}
                        {p.type ? ` · ${p.type}` : ""}
                      </p>
                      <div className="res-times">
                        <span>
                          {" "}
                          {fmtRestrTime(
                            r.allowedStartHour,
                            r.allowedStartMinute,
                          )}{" "}
                          – {fmtRestrTime(r.allowedEndHour, r.allowedEndMinute)}
                        </span>
                        {r.blockedWeekdays.length > 0 && (
                          <>
                            <span className="res-arrow">·</span>
                            <span>
                              {" "}
                              {r.blockedWeekdays
                                .map((d) => DAY_NAMES[d].slice(0, 3))
                                .join(", ")}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="res-card-right">
                      <span
                        className={`res-status ${p.unavailable ? "res-status--past" : "res-status--upcoming"}`}
                      >
                        {p.unavailable ? "Unavailable" : "Available"}
                      </span>
                      <div className="res-actions">
                        <button
                          className="res-btn res-btn--sm res-btn--ghost"
                          onClick={() => handleToggleAvailability(p)}
                        >
                          {p.unavailable ? "Enable" : "Disable"}
                        </button>
                        <button
                          className="res-btn res-btn--sm res-btn--ghost"
                          onClick={() => openPlaceEdit(p)}
                        >
                          Edit
                        </button>
                        <button
                          className="res-btn res-btn--sm res-btn--danger"
                          onClick={() => handlePlaceDelete(p)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReservationAdmin;
