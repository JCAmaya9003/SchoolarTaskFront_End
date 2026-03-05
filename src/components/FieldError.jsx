/**
 * FieldError — Inline error message below a form field.
 *
 * Usage:
 *   <FieldError message={errors.firstName} />
 *
 * Renders nothing when message is falsy.
 */
const FieldError = ({ message, id }) => {
  if (!message) return null;
  return (
    <p id={id} className="field-error" role="alert" aria-live="polite">
      {message}
    </p>
  );
};

export default FieldError;
