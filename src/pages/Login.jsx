/**
 * Login Page
 *
 * User authentication page with email/password login.
 * Google OAuth preserved for future use.
 * Updated to use authService with dual-mode support.
 * + Submit-time custom validation (useFormErrors).
 */

import { useState, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import * as authService from "../services/authService";
import useFormErrors from "../hooks/useFormErrors";
import FieldError from "../components/FieldError";
import "../assets/login.css";

// ── Validation ──────────────────────────────────────────────────
const validateLogin = ({ email, password }) => {
  const errs = {};
  if (!email.trim()) {
    errs.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errs.email = "Enter a valid email address (e.g. user@school.com).";
  }
  if (!password) {
    errs.password = "Password is required.";
  } else if (password.length < 4) {
    errs.password = "Password must be at least 4 characters.";
  }
  return errs;
};

const Login = () => {
  const { handleSaveToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    clearFieldError(name);
    setLoginError("");
  };

  // ── Submit logic (runs only when validation passes) ──────────
  const doLogin = useCallback(
    async (data) => {
      try {
        const result = await authService.login(data.email, data.password);
        if (result.token) {
          await handleSaveToken(result.token, result.user);
          navigate("/home");
        }
      } catch {
        // Always show a generic message — never expose whether email/password was wrong
        setLoginError("Incorrect credentials. Please try again.");
      }
    },
    [handleSaveToken, navigate],
  );

  const { errors, trySubmit, clearFieldError } = useFormErrors(
    validateLogin,
    doLogin,
  );

  /* PRESERVED FOR FUTURE USE - Google OAuth: */
  const handleGoogleLogin = () => {
    alert(
      "Google OAuth is currently disabled. Please use email/password login.",
    );
  };

  return (
    <div className="login-page">
      {/* Left hero panel */}
      <div className="side-image">
        <div className="hero-brand">
          <div className="hero-brand-line" />
          <h1 className="hero-brand-name">SchoolarTask</h1>
          <p className="hero-brand-tagline">
            The academic management platform for modern schools.
          </p>
        </div>
      </div>

      {/* Login form panel */}
      <div className="login-container">
        <div className="login-header">
          <h3>SchoolarTask</h3>
        </div>
        <h1>Sign in</h1>
        <p className="login-intro">
          Welcome back. Enter your credentials to continue.
        </p>

        {loginError && <div className="login-error">{loginError}</div>}

        <form onSubmit={(e) => trySubmit(e, formData)} noValidate>
          <div className={errors.email ? "field-has-error" : ""}>
            <label className="login-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              type="email"
              placeholder="example@school.com"
              autoComplete="email"
            />
            <FieldError message={errors.email} />
          </div>

          <div className={errors.password ? "field-has-error" : ""}>
            <label className="login-label" htmlFor="login-password">
              Password
            </label>
            <div className="login-pw-wrap">
              <input
                id="login-password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                type={showPwd ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="login-pw-toggle"
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                {showPwd ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
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
                    width="18"
                    height="18"
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

          <a href="#" className="forgot-password">
            Forgot your password?
          </a>
          <button type="submit" className="login-button">
            Sign In
          </button>
        </form>

        <div className="divider">
          <span>or</span>
        </div>
        <button onClick={handleGoogleLogin} className="google-login-button">
          <img
            src="https://w7.pngwing.com/pngs/612/285/png-transparent-logo-google-g-google-s-logo-icon.png"
            alt="Google"
          />
          Continue with Google
        </button>
        <footer>No account? Contact your school administrator.</footer>
      </div>
    </div>
  );
};

export default Login;
