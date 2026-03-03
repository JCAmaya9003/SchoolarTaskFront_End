/**
 * Config Utils
 * 
 * Backward compatibility layer for existing code.
 * Imports configuration from appConfig.js
 */
import { APP_CONFIG } from '../config/appConfig';
export const config = {
  backUrl: APP_CONFIG.BACKEND_URL,
  googleClientId: APP_CONFIG.GOOGLE_CLIENT_ID,
};
