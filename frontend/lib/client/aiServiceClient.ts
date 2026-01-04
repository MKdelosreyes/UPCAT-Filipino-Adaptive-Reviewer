import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';

// Create axios instances
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export const aiServiceClient = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor to add auth token
const addAuthToken = (config: any) => {
  if (typeof window !== 'undefined') {
    const tokens = localStorage.getItem('tokens');
    if (tokens) {
      try {
        const parsed = JSON.parse(tokens);
        if (parsed.access) {
          config.headers.Authorization = `Bearer ${parsed.access}`;
        }
      } catch (error) {
        console.error('Failed to parse tokens:', error);
      }
    }
  }
  return config;
};

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const tokens = localStorage.getItem('tokens');
      if (tokens) {
        try {
          const parsed = JSON.parse(tokens);
          if (parsed.access) {
            config.headers.Authorization = `Bearer ${parsed.access}`;
          }
        } catch (e) {
          console.error('Failed to parse tokens:', e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

aiServiceClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const tokens = localStorage.getItem('tokens');
      if (tokens) {
        try {
          const parsed = JSON.parse(tokens);
          if (parsed.access) {
            config.headers.Authorization = `Bearer ${parsed.access}`;
          }
        } catch (e) {
          console.error('Failed to parse tokens:', e);
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
const handle401Error = (error: any) => {
  if (error.response?.status === 401) {
    // Clear auth data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tokens');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
};

apiClient.interceptors.response.use(
  (response) => response,
  handle401Error
);

aiServiceClient.interceptors.response.use(
  (response) => response,
  handle401Error
);