/**
 * Reservation Service
 *
 * Dual-mode reservation management for academic places.
 * Handles CRUD for reservations, academic places, and admin restrictions.
 * All field names use English to match seed data and backend API.
 */

import { APP_CONFIG, STORAGE_KEYS } from "../config/appConfig";
import * as storageService from "./storageService";
import * as authService from "./authService";

// ─── helpers ─────────────────────────────────────────────────
const genId = () => String(Date.now()) + Math.random().toString(36).slice(2, 7);

// ─── Default per-place restrictions ──────────────────────────
export const DEFAULT_PLACE_RESTRICTIONS = {
  allowedStartHour: 7,
  allowedStartMinute: 0,
  allowedEndHour: 17,
  allowedEndMinute: 30,
  blockedWeekdays: [0], // 0 = Sunday
};

/**
 * Validate date/time against the specific place's own restrictions.
 * @param {string} start_date  ISO / datetime-local string
 * @param {string} end_date    ISO / datetime-local string
 * @param {Object} place       Academic place object (must have .place name + .restrictions)
 */
const validateAgainstRestrictions = (start_date, end_date, place) => {
  const r = place?.restrictions || DEFAULT_PLACE_RESTRICTIONS;
  const start = new Date(start_date);
  const end = new Date(end_date);
  const DAY_NAMES = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Check blocked weekdays
  for (const day of [start.getDay(), end.getDay()]) {
    if (r.blockedWeekdays.includes(day)) {
      throw new Error(
        `"${place?.place}" does not allow reservations on ${DAY_NAMES[day]}s`,
      );
    }
  }

  // Check allowed hour range
  const allowedStart = r.allowedStartHour * 60 + r.allowedStartMinute;
  const allowedEnd = r.allowedEndHour * 60 + r.allowedEndMinute;
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const fmtTime = (h, m) =>
    `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

  if (startMinutes < allowedStart) {
    throw new Error(
      `"${place?.place}" cannot be reserved before ${fmtTime(r.allowedStartHour, r.allowedStartMinute)}`,
    );
  }
  if (endMinutes > allowedEnd) {
    throw new Error(
      `"${place?.place}" cannot be reserved after ${fmtTime(r.allowedEndHour, r.allowedEndMinute)}`,
    );
  }
};

// RESERVATIONS

/**
 * Get all reservations (visible to all roles for availability checking)
 */
export const getAllReservations = async () => {
  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/reservations/all`, {
      method: 'GET', credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to fetch reservations');
    return await response.json();
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    const reservations =
      storageService.getItem(STORAGE_KEYS.RESERVATIONS) || [];
    return reservations.sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date),
    );
  }
};

/**
 * Create a new reservation (validates against admin restrictions)
 */
export const createReservation = async (reservationData) => {
  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/reservations/create`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData), credentials: 'include'
    });
    if (!response.ok) { const e = await response.json(); throw new Error(e.message || 'Failed'); }
    return await response.json();
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    const user = authService.getCurrentUser();
    if (!user) throw new Error("Not authenticated");

    // Validate end > start
    const newStart = new Date(reservationData.start_date);
    const newEnd = new Date(reservationData.end_date);
    if (newEnd <= newStart)
      throw new Error("End date/time must be after start date/time");

    const reservations =
      storageService.getItem(STORAGE_KEYS.RESERVATIONS) || [];
    const places = storageService.getItem(STORAGE_KEYS.ACADEMIC_PLACES) || [];
    const place = places.find((p) => p._id === reservationData.place);
    if (!place) throw new Error("Academic place not found");

    // Check if place is marked unavailable
    if (place.unavailable)
      throw new Error(`"${place.place}" is currently unavailable`);

    // Validate against place's own restrictions (now that we have the place)
    validateAgainstRestrictions(
      reservationData.start_date,
      reservationData.end_date,
      place,
    );

    // Conflict check
    const hasConflict = reservations.some((r) => {
      if ((r.place?._id || r.place) !== place._id) return false;
      return newStart < new Date(r.end_date) && newEnd > new Date(r.start_date);
    });
    if (hasConflict)
      throw new Error("This time slot is already reserved for that place");

    const newReservation = {
      _id: genId(),
      place: { _id: place._id, place: place.place },
      userEmail: user.email,
      user: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      description: reservationData.description,
      start_date: reservationData.start_date,
      end_date: reservationData.end_date,
      createdAt: new Date().toISOString(),
    };

    reservations.push(newReservation);
    storageService.setItem(STORAGE_KEYS.RESERVATIONS, reservations);
    return newReservation;
  }
};

/**
 * Update a reservation (validates against restrictions)
 */
export const updateReservation = async (id, updatedData) => {
  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE:
    const response = await fetch(`${APP_CONFIG.BACKEND_URL}/api/reservations`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updatedData }), credentials: 'include'
    });
    if (!response.ok) { const e = await response.json(); throw new Error(e.message || 'Failed'); }
    return await response.json();
    */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    const user = authService.getCurrentUser();
    const reservations =
      storageService.getItem(STORAGE_KEYS.RESERVATIONS) || [];
    const idx = reservations.findIndex((r) => r._id === id);
    if (idx === -1) throw new Error("Reservation not found");

    const res = reservations[idx];
    if (user.role !== "admin" && res.userEmail !== user.email) {
      throw new Error(
        "Permission denied: you can only edit your own reservations",
      );
    }

    const places = storageService.getItem(STORAGE_KEYS.ACADEMIC_PLACES) || [];
    if (updatedData.place) {
      const p = places.find((p) => p._id === updatedData.place);
      if (p) res.place = { _id: p._id, place: p.place };
    }
    if (updatedData.description !== undefined)
      res.description = updatedData.description;
    if (updatedData.start_date) res.start_date = updatedData.start_date;
    if (updatedData.end_date) res.end_date = updatedData.end_date;

    if (new Date(res.end_date) <= new Date(res.start_date)) {
      throw new Error("End date/time must be after start date/time");
    }

    // Validate restrictions on updated times using the (possibly updated) place
    const updatedPlace =
      places.find((p) => p._id === (res.place?._id || res.place)) || {};
    validateAgainstRestrictions(res.start_date, res.end_date, updatedPlace);

    reservations[idx] = res;
    storageService.setItem(STORAGE_KEYS.RESERVATIONS, reservations);
    return res;
  }
};

/**
 * Delete a reservation
 */
export const deleteReservation = async (id) => {
  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE: ... */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    const user = authService.getCurrentUser();
    const reservations =
      storageService.getItem(STORAGE_KEYS.RESERVATIONS) || [];
    const res = reservations.find((r) => r._id === id);
    if (!res) throw new Error("Reservation not found");
    if (user.role !== "admin" && res.userEmail !== user.email) {
      throw new Error(
        "Permission denied: you can only delete your own reservations",
      );
    }
    storageService.setItem(
      STORAGE_KEYS.RESERVATIONS,
      reservations.filter((r) => r._id !== id),
    );
    return { message: "Reservation deleted successfully" };
  }
};

// ACADEMIC PLACES (admin CRUD)

export const getAcademicPlaces = async () => {
  if (APP_CONFIG.USE_BACKEND) {
    /* PRESERVED FOR FUTURE USE: ... */
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    return storageService.getItem(STORAGE_KEYS.ACADEMIC_PLACES) || [];
  }
};

export const createAcademicPlace = async (placeData) => {
  if (APP_CONFIG.USE_BACKEND) {
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    const user = authService.getCurrentUser();
    if (user?.role !== "admin")
      throw new Error("Permission denied: admin only");
    const places = storageService.getItem(STORAGE_KEYS.ACADEMIC_PLACES) || [];
    const newPlace = {
      _id: genId(),
      unavailable: false,
      restrictions: { ...DEFAULT_PLACE_RESTRICTIONS },
      ...placeData,
    };

    places.push(newPlace);
    storageService.setItem(STORAGE_KEYS.ACADEMIC_PLACES, places);
    return newPlace;
  }
};

export const updateAcademicPlace = async (id, placeData) => {
  if (APP_CONFIG.USE_BACKEND) {
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    const user = authService.getCurrentUser();
    if (user?.role !== "admin")
      throw new Error("Permission denied: admin only");
    const places = storageService.getItem(STORAGE_KEYS.ACADEMIC_PLACES) || [];
    const idx = places.findIndex((p) => p._id === id);
    if (idx === -1) throw new Error("Place not found");
    places[idx] = { ...places[idx], ...placeData };
    storageService.setItem(STORAGE_KEYS.ACADEMIC_PLACES, places);
    return places[idx];
  }
};

export const deleteAcademicPlace = async (id) => {
  if (APP_CONFIG.USE_BACKEND) {
    throw new Error(
      "Backend mode not yet implemented. Set USE_BACKEND to false.",
    );
  } else {
    const user = authService.getCurrentUser();
    if (user?.role !== "admin")
      throw new Error("Permission denied: admin only");
    const places = storageService.getItem(STORAGE_KEYS.ACADEMIC_PLACES) || [];
    if (!places.find((p) => p._id === id)) throw new Error("Place not found");
    storageService.setItem(
      STORAGE_KEYS.ACADEMIC_PLACES,
      places.filter((p) => p._id !== id),
    );
    return { message: "Place deleted" };
  }
};
