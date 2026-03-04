/**
 * useToast — Notification queue hook.
 * Returns { toasts, showToast, dismissToast }
 *
 * Usage:
 *   const { toasts, showToast, dismissToast } = useToast();
 *   showToast("Saved!", "success");
 *   showToast("Something went wrong", "error");
 */
import { useState, useCallback } from "react";

let _id = 0;

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        setTimeout(() => dismissToast(id), duration);
      }
    },
    [dismissToast],
  );

  return { toasts, showToast, dismissToast };
};

export default useToast;
