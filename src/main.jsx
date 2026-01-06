import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from "./App";
import { AuthProvider } from './contexts/AuthContext';
import { GoogleOAuthProvider } from "@react-oauth/google";
import { config } from './utils/ConfigUtils';

const googleClientId = config.googleClientId;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <GoogleOAuthProvider clientId={googleClientId}>
        <App />
      </GoogleOAuthProvider>
    </AuthProvider>
  </StrictMode>,
)