/**
 * useFormErrors — Submit-time validation hook.
 *
 * Usage:
 *   const { errors, trySubmit, clearErrors } = useFormErrors(validateFn, submitFn);
 *
 *   - validateFn(formData) → returns { field: "message" } object (empty = valid)
 *   - submitFn(formData)   → async; called only when validation passes
 *   - trySubmit(e, formData) → call from onSubmit; prevents default
 *   - errors               → { field: "message" } | {}
 *   - clearErrors()        → reset after cancel / form reset
 *   - hasErrors            → boolean shorthand
 *
 * Design:
 *   • Validation ONLY runs on submit — zero live/eager-red states.
 *   • After a failed submit, errors are cleared field-by-field as the user
 *     edits that field (pass `onFieldChange(field)` to each onChange).
 *   • errorList — sorted array of { field, message } for rendering a summary.
 */
import { useState, useCallback } from "react";

const useFormErrors = (validateFn, submitFn) => {
  const [errors, setErrors] = useState({});

  const trySubmit = useCallback(
    async (e, formData) => {
      e.preventDefault();
      const errs = validateFn(formData);
      if (Object.keys(errs).length > 0) {
        setErrors(errs);
        // Scroll first error field into view if possible
        const firstKey = Object.keys(errs)[0];
        const el =
          document.getElementById(`field-${firstKey}`) ||
          document.querySelector(`[name="${firstKey}"]`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      setErrors({});
      await submitFn(formData);
    },
    [validateFn, submitFn],
  );

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearErrors = useCallback(() => setErrors({}), []);

  const errorList = Object.entries(errors).map(([field, message]) => ({
    field,
    message,
  }));

  return {
    errors,
    errorList,
    hasErrors: errorList.length > 0,
    trySubmit,
    clearFieldError,
    clearErrors,
  };
};

export default useFormErrors;
