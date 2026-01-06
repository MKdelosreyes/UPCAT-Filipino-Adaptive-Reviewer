import axios from 'axios';
import { supabase } from '@/lib/supabase';

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8001';
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// ✅ AI Service Client (FastAPI - Port 8001)
export const aiServiceClient = axios.create({
  baseURL: AI_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ✅ Backend API Client (Django - Port 8000)
export const apiClient = axios.create({
  baseURL: BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// ✅ Request Interceptor: Add Supabase token automatically
const addSupabaseToken = async (config: any) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      console.log('✅ Adding Supabase token to request:', config.url);
      config.headers.Authorization = `Bearer ${session.access_token}`;
    } else {
      console.warn('⚠️ No Supabase session found for request:', config.url);
    }
  } catch (error) {
    console.error('❌ Failed to get Supabase session:', error);
  }
  
  return config;
};

// ✅ Response Interceptor: Handle token expiration with auto-refresh
const handleTokenExpiration = async (error: any) => {
  const originalRequest = error.config;

  // If 401 and we haven't retried yet
  if (error.response?.status === 401 && !originalRequest._retry) {
    originalRequest._retry = true;

    console.log('🔄 Token expired, attempting refresh...');

    try {
      // Try to refresh the session
      const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError || !session) {
        // Refresh failed - redirect to login
        console.error('❌ Token refresh failed:', refreshError);
        
        // Sign out and redirect
        await supabase.auth.signOut();
        
        if (typeof window !== 'undefined') {
          console.log('🚪 Redirecting to login...');
          window.location.href = '/login?reason=session_expired';
        }
        
        return Promise.reject(error);
      }

      console.log('✅ Token refreshed successfully');

      // Retry the original request with new token
      originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
      
      // Retry with the appropriate client
      const client = originalRequest.baseURL === AI_SERVICE_URL ? aiServiceClient : apiClient;
      return client(originalRequest);
      
    } catch (refreshError) {
      console.error('❌ Error during token refresh:', refreshError);
      
      // Sign out and redirect
      await supabase.auth.signOut();
      
      if (typeof window !== 'undefined') {
        window.location.href = '/login?reason=session_error';
      }
      
      return Promise.reject(error);
    }
  }

  return Promise.reject(error);
};

// Add interceptors to both clients
aiServiceClient.interceptors.request.use(
  addSupabaseToken,
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.request.use(
  addSupabaseToken,
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptors to both clients
aiServiceClient.interceptors.response.use(
  (response) => response,
  handleTokenExpiration
);

apiClient.interceptors.response.use(
  (response) => response,
  handleTokenExpiration
);