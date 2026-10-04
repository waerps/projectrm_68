const DEFAULT_API_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://sornserm-backend.onrender.com";

// Preview deployments do not always inherit VITE_API_URL. Falling back to the
// deployed API keeps public pages usable, while local development still points
// to the local backend.
export const API_URL = String(import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/$/, "");
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
