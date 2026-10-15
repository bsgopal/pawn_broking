import axios from 'axios';

// Detect tenant code from URL query param (?tenant= / ?code=), subdomain, or local storage
export function getDetectedTenantCode() {
  try {
    if (typeof window !== 'undefined' && window.location.search) {
      const urlParams = new URLSearchParams(window.location.search);
      const urlCode = urlParams.get('tenant') || urlParams.get('code') || urlParams.get('customerCode');
      if (urlCode) {
        const clean = urlCode.trim().toLowerCase();
        localStorage.setItem('pawn_tenant_code', clean);
        return clean;
      }
    }
  } catch (e) {}

  const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
  const stored = typeof window !== 'undefined' ? localStorage.getItem('pawn_tenant_code') : null;
  if (stored) return stored;

  // Cloud platform subdomains (Vercel, Netlify, Render) must never be treated as tenant codes
  if (
    host.endsWith('.vercel.app') ||
    host.endsWith('.now.sh') ||
    host.endsWith('.onrender.com') ||
    host.endsWith('.netlify.app')
  ) {
    return '';
  }

  const parts = host.split('.');
  if (parts.length >= 3 && (parts[0] === 'pb' || parts[0] === 'pawn')) {
    return parts[1];
  }
  return '';
}

const rawBase = import.meta.env.VITE_API_URL ? String(import.meta.env.VITE_API_URL).trim().replace(/\/+$/, '') : '';
const apiBase = rawBase ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`) : '/api';

const api = axios.create({
  baseURL: apiBase,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Token & Tenant Identification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pawn_auth_token');
  const tenantCode = getDetectedTenantCode();
  const clientId = localStorage.getItem('pawn_client_id');

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  if (tenantCode) {
    config.headers['x-customer-code'] = tenantCode;
    config.headers['x-tenant-code'] = tenantCode;
  }
  if (clientId) {
    config.headers['x-client-id'] = clientId;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Error handling & Session Expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = error.config?.url?.includes('/auth/') || error.config?.url?.includes('/settings/oauth');
      if (!isAuthRoute) {
        localStorage.removeItem('pawn_auth_token');
        localStorage.removeItem('pawn_user');
      }
    }
    return Promise.reject(error);
  }
);

// Telemetry tracker helper
export function logScreenVisit(screenPath, actionDetails = '') {
  api.post('/telemetry/page-view', { screenPath, actionDetails }).catch(() => {});
}

export default api;
