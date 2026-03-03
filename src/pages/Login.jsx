/**
 * Login Page
 *
 * User authentication page with email/password login.
 * Google OAuth preserved for future use.
 * Updated to use authService with dual-mode support.
 */

import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import * as authService from "../services/authService";
import "../assets/login.css";

/* PRESERVED FOR FUTURE USE:
import { config } from "../utils/ConfigUtils";
*/

const Login = () => {
  const { handleSaveToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    try {
      /* PRESERVED FOR FUTURE USE - Backend API login:
      const response = await fetch(`${config.backUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        handleSaveToken(result.token, result.user);
        alert("Login successful!");
        navigate("/home");
      } else {
        alert(result.message || "Login failed");
      }
      */

      // Use authService for login
      const result = await authService.login(formData.email, formData.password);

      if (result.token) {
        await handleSaveToken(result.token, result.user);
        navigate("/home");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setLoginError(error.message || "Invalid email or password");
    }
  };

  /* PRESERVED FOR FUTURE USE - Google OAuth:
  const handleGoogleLogin = async () => {
    try {
      const res = await fetch(`${config.backUrl}/oauth`, { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // Redirect to Google OAuth
      } else {
        alert("Failed to get Google OAuth URL");
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert("Error during Google login");
    }
  };
  */

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

        <form onSubmit={handleSubmitLogin}>
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
            required
            autoComplete="email"
          />
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
              required
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
