import "./index.css"; // Global design tokens — MUST be first
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { config } from "./utils/ConfigUtils";
import { APP_CONFIG } from "./config/appConfig";
import { initializeSeedData } from "./services/seedData";
import "./utils/devUtils"; // Dev utilities for console
const googleClientId = config.googleClientId;
// Initialize seed data if using localStorage mode
if (!APP_CONFIG.USE_BACKEND) {
  initializeSeedData();
}
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </AuthProvider>
  </StrictMode>,
);
