import axios from "axios";

const baseURL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api").trim();

export const backendApiClient = axios.create({
  baseURL,
});

// Attach JWT access token (same storage shape you already use elsewhere)
backendApiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  try {
    const raw = localStorage.getItem("tokens");
    if (!raw) return config;

    const parsed = JSON.parse(raw);
    const token: string | undefined = parsed?.access;

    if (token) {
      config.headers = config.headers ?? {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }

  return config;
});