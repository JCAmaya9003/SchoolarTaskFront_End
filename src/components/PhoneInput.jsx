/**
 * PhoneInput — Country code picker + validated phone number input.
 *
 * Props:
 *   label      (string)  — displayed above the field group
 *   dialCode   (string)  — controlled dialCode value, e.g. "+1"
 *   phone      (string)  — controlled phone number (digits only)
 *   onChange   (fn)      — called with ({ dialCode, phone })
 *   required   (bool)
 *   id         (string)  — unique id prefix
 *   submitTried (bool)   — when true, errors show even if untouched (pass
 *                          true from the parent's submit handler)
 *
 * Validation is shown only AFTER the user has interacted with the number
 * input (onBlur) OR after the parent form has been submitted (submitTried).
 * This prevents the "red before you've typed anything" problem.
 *
 * Validation rules enforced:
 *   - Digits only
 *   - Exact digit count per country (from usePhoneCountries)
 *   - No all-zeros number  (e.g. 00000000)
 *   - Not empty when required
 */
import { useState, useEffect, useMemo } from "react";
import usePhoneCountries from "../hooks/usePhoneCountries";
import "../assets/PhoneInput.css";

const PhoneInput = ({
  label = "Phone",
  dialCode,
  phone,
  onChange,
  required = false,
  id = "phone",
  submitTried = false,
}) => {
  const { countries, isLoading } = usePhoneCountries();

  // touched = user has left the number input at least once
  const [touched, setTouched] = useState(false);
  const showErrors = touched || submitTried;

  // Reset touched state when dial code changes (new country = fresh start)
  useEffect(() => {
    setTouched(false);
  }, [dialCode]);

  // Set default to USA (+1) on mount if not yet set
  useEffect(() => {
    if (!dialCode && countries.length > 0) {
      const usa = countries.find((c) => c.cca2 === "US") || countries[0];
      onChange({ dialCode: usa.dialCode, phone: phone || "" });
    }
  }, [countries]); // eslint-disable-line react-hooks/exhaustive-deps

  // Find current country metadata
  const currentCountry = useMemo(
    () => countries.find((c) => c.dialCode === dialCode) || null,
    [countries, dialCode],
  );
  const digits = currentCountry?.digits ?? 10;

  const handleDialChange = (e) => {
    const newDial = e.target.value;
    // Reset phone number when country changes
    onChange({ dialCode: newDial, phone: "" });
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, ""); // strip non-digits
    const clamped = raw.slice(0, digits); // enforce max length
    onChange({ dialCode: dialCode || "+1", phone: clamped });
  };

  // Inline validation message (only shown when showErrors)
  const getError = () => {
    if (!phone) return required ? "Phone number is required." : null;
    if (phone.length !== digits)
      return `Must be exactly ${digits} digits for ${currentCountry?.name || "this country"} (${digits - phone.length} more needed).`;
    if (/^0+$/.test(phone)) return "Phone number cannot be all zeros.";
    return null;
  };
  const err = showErrors ? getError() : null;
  // Show a green "complete" indicator (independent of touched)
  const isComplete = phone?.length === digits && !/^0+$/.test(phone || "");

  return (
    <div className="phi-group">
      {label && (
        <label className="phi-label" htmlFor={`${id}-number`}>
          {label}
          {required && <span className="phi-required"> *</span>}
        </label>
      )}
      <div
        className={`phi-row ${err ? "phi-row--error" : isComplete ? "phi-row--complete" : ""}`}
      >
        {/* Country code select */}
        <select
          id={`${id}-dial`}
          className="phi-dial"
          value={dialCode || ""}
          onChange={handleDialChange}
          disabled={isLoading}
          title="Country dial code"
        >
          {isLoading && <option value="">Loading…</option>}
          {countries.map((c) => (
            <option key={c.cca2} value={c.dialCode}>
              {c.dialCode} {c.name}
            </option>
          ))}
        </select>

        {/* Number input */}
        <input
          id={`${id}-number`}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          className="phi-number"
          value={phone || ""}
          onChange={handlePhoneChange}
          onBlur={() => setTouched(true)}
          placeholder={"0".repeat(digits)}
          maxLength={digits}
          minLength={digits}
          required={required}
          aria-describedby={err ? `${id}-error` : undefined}
          aria-invalid={err ? "true" : undefined}
        />

        {/* Digit count badge */}
        <span className={`phi-hint ${isComplete ? "phi-hint--done" : ""}`}>
          {phone?.length || 0}/{digits}
        </span>
      </div>

      {err && (
        <p id={`${id}-error`} className="phi-error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
};

export default PhoneInput;
