/**
 * ParentPickerModal — Searchable parent selection overlay.
 * Opens when admin clicks "Assign Parent" in the student form.
 *
 * Props:
 *   parents      — full array of parent objects
 *   onSelect(parent) — called with chosen parent; caller handles auto-fill
 *   onClose      — closes the modal without selecting
 */
import { useState } from "react";
import "../assets/ParentPickerModal.css";

const ParentPickerModal = ({ parents, onSelect, onClose }) => {
  const [filterFirst, setFilterFirst] = useState("");
  const [filterLast, setFilterLast] = useState("");
  const [filterEmail, setFilterEmail] = useState("");

  const filtered = (parents || []).filter((p) => {
    if (!p) return false;
    const matchFirst = p.firstName
      ?.toLowerCase()
      .includes(filterFirst.toLowerCase().trim());
    const matchLast = p.lastName
      ?.toLowerCase()
      .includes(filterLast.toLowerCase().trim());
    const matchEmail = p.email
      ?.toLowerCase()
      .includes(filterEmail.toLowerCase().trim());
    return matchFirst && matchLast && matchEmail;
  });

  const hasFilter = filterFirst || filterLast || filterEmail;
  const clearFilters = () => {
    setFilterFirst("");
    setFilterLast("");
    setFilterEmail("");
  };

  return (
    <div className="ppm-backdrop" onClick={onClose}>
      <div className="ppm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ppm-header">
          <h3 className="ppm-title">Assign Parent</h3>
          <button className="ppm-close" onClick={onClose} aria-label="Close">
            <svg
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filter bar */}
        <div className="ppm-filters">
          <div className="ppm-filter-group">
            <label className="ppm-filter-label">First name</label>
            <input
              className="ppm-filter-input"
              type="text"
              placeholder="e.g. John"
              value={filterFirst}
              onChange={(e) => setFilterFirst(e.target.value)}
              autoFocus
            />
          </div>
          <div className="ppm-filter-group">
            <label className="ppm-filter-label">Last name</label>
            <input
              className="ppm-filter-input"
              type="text"
              placeholder="e.g. Doe"
              value={filterLast}
              onChange={(e) => setFilterLast(e.target.value)}
            />
          </div>
          <div className="ppm-filter-group ppm-filter-group--wide">
            <label className="ppm-filter-label">Email</label>
            <input
              className="ppm-filter-input"
              type="text"
              placeholder="e.g. john@..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
            />
          </div>
          {hasFilter && (
            <button
              className="ppm-clear-btn"
              onClick={clearFilters}
              title="Clear all filters"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Parent list */}
        <div className="ppm-list">
          {!hasFilter && parents?.length > 0 && (
            <p className="ppm-hint">
              {parents.length} parent{parents.length !== 1 ? "s" : ""} available
              — use filters above to narrow down.
            </p>
          )}
          {filtered.length === 0 && (
            <p className="ppm-empty">
              {parents?.length === 0
                ? "No parents created yet."
                : "No parents match these filters."}
            </p>
          )}
          {filtered.map((p) => (
            <div key={p.email} className="ppm-row">
              <div className="ppm-row-info">
                <span className="ppm-row-name">
                  {p.firstName} {p.lastName}
                </span>
                <span className="ppm-row-email">{p.email}</span>
              </div>
              <button
                className="btn btn-primary btn-sm ppm-select-btn"
                onClick={() => onSelect(p)}
              >
                Select
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="ppm-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentPickerModal;
