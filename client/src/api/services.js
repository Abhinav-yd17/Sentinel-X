import api from './axios.config';

// ── Auth ──────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  register: (data) => api.post('/auth/register', data),
};

// ── Analytics ─────────────────────────────────────────────────
export const analyticsAPI = {
  overview: () => api.get('/analytics/overview'),
  threatTrend: () => api.get('/analytics/threat-trend'),
  topRiskyUsers: (limit = 10) => api.get(`/analytics/top-risky-users?limit=${limit}`),
  eventTypes: (params = '') => api.get(`/analytics/event-types${params}`),
  geoDistribution: () => api.get('/analytics/geo-distribution'),
  alertResolution: () => api.get('/analytics/alert-resolution'),
};

// ── Events ────────────────────────────────────────────────────
export const eventsAPI = {
  list: (params) => api.get('/events', { params }),
  get: (id) => api.get(`/events/${id}`),
};

// ── Alerts ────────────────────────────────────────────────────
export const alertsAPI = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  updateStatus: (id, status, resolutionNotes) =>
    api.patch(`/alerts/${id}/status`, { status, resolutionNotes }),
  stats: () => api.get('/alerts/stats/summary'),
  delete: (id) => api.delete(`/alerts/${id}`),
};

// ── Users (Monitored) ─────────────────────────────────────────
export const usersAPI = {
  list: (params) => api.get('/users', { params }),
  risk: (externalUserId) => api.get(`/users/${externalUserId}/risk`),
  timeline: (externalUserId, params) => api.get(`/users/${externalUserId}/timeline`, { params }),
  updateStatus: (externalUserId, accountStatus) =>
    api.patch(`/users/${externalUserId}/status`, { accountStatus }),
  portalUsers: () => api.get('/users/portal'),
  deletePortal: (id) => api.delete(`/users/portal/${id}`),
};

// ── Rules ─────────────────────────────────────────────────────
export const rulesAPI = {
  list: () => api.get('/rules'),
  get: (id) => api.get(`/rules/${id}`),
  create: (data) => api.post('/rules', data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  toggle: (id) => api.patch(`/rules/${id}/toggle`),
  delete: (id) => api.delete(`/rules/${id}`),
};
