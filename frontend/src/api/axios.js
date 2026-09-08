import axios from 'axios';

// Resolve base API URL:
// 1. If VITE_API_BASE_URL is explicitly configured, use it (ensuring it points to /api/v1).
// 2. In local development without env var, default to http://localhost:8000/api/v1.
// 3. In production without env var, use relative /api/v1 to prevent Mixed Content HTTP/HTTPS browser blocks.
const envApiUrl = import.meta.env.VITE_API_BASE_URL;

let API_BASE_URL = 'http://localhost:8000/api/v1';

if (envApiUrl) {
  API_BASE_URL = envApiUrl.endsWith('/api/v1')
    ? envApiUrl
    : `${envApiUrl.replace(/\/$/, '')}/api/v1`;
} else if (import.meta.env.PROD) {
  API_BASE_URL = '/api/v1';
}

export { API_BASE_URL };

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Fast timeout (4s) so if backend is unreachable on client presentations,
  // the app transitions seamlessly to the offline mock dataset without freezing.
  timeout: 4000,
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 and reject HTML responses (from SPA rewrites)
api.interceptors.response.use(
  (response) => {
    // If the server returned an HTML document (e.g. Vercel SPA rewrite fallback for an unhosted API route)
    const contentType = response.headers?.['content-type'] || '';
    if (
      (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype')) ||
      contentType.includes('text/html')
    ) {
      return Promise.reject(new Error('Backend API endpoint returned HTML instead of JSON. Backend service unavailable.'));
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      const hasToken = localStorage.getItem('access_token');
      if (hasToken && hasToken !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
