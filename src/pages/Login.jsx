import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { config } from "../utils/ConfigUtils";
import "../assets/login.css";


//const URL_back = config.backUrl;

const Login = () => {
  const { handleSaveToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${config.backUrl}/api/users/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const result = await response.json();

      if (response.ok) {
        handleSaveToken(result.token);
        alert("Login successful!");
        navigate("/home");
      } else {
        alert(result.message || "Login failed");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("An error occurred during login");
    }
  };

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

  return (
    <div className="login-page">
      {/* Left image */}
      <div className="side-image">
        <img src="https://placehold.co/600x400?text=Campus+image" alt="Side Image 1" />
      </div>

      {/* Login section */}
      <div className="login-container">
        <div className="login-header">

          <img src="https://via.placeholder.com/60" alt="School Logo" className="school-logo" />

          <h3>Nombre del colegio</h3>
        </div>
        <h1>Iniciar Sesión</h1>
        <form onSubmit={handleSubmitLogin}>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            placeholder="Correo electrónico"
            required
          />
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            type="password"
            placeholder="Contraseña"
            required
          />
          <a href="#" className="forgot-password">
            ¿Olvidaste tu contraseña?
          </a>
          <button type="submit" className="login-button">
            Ingresar
          </button>
        </form>
        <div className="divider">
          <span>o inicia sesión con</span>
        </div>
        <button onClick={handleGoogleLogin} className="google-login-button">

          <img
            src="https://w7.pngwing.com/pngs/612/285/png-transparent-logo-google-g-google-s-logo-icon.png"
            alt="Google Logo"
          />

          Iniciar sesión con Google
        </button>
        <footer>
          No tienes cuenta? Contáctanos al +503 1234-5678
        </footer>
      </div>

      {/* Right image */}
      <div className="side-image">
        <img src="https://placehold.co/600x400?text=school+logo" alt="Side Image 2" />

      </div>
    </div>
  );
};

export default Login;


