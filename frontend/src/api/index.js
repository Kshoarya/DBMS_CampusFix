const BASE_URL = '/api';

function getAuthHeader() {
  const token = localStorage.getItem('cmts_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getMe: () => request('/auth/me'),
  getDemoUsers: () => request('/auth/demo-users'),

  // Tickets
  getTickets: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.append(key, val);
      }
    });
    const queryStr = searchParams.toString();
    return request(`/tickets${queryStr ? `?${queryStr}` : ''}`);
  },
  getTicketById: (id) => request(`/tickets/${id}`),
  createTicket: (data) => request('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  assignTicket: (id, data) => request(`/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  updateTechStatus: (id, data) => request(`/tickets/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateAdminStatus: (id, data) => request(`/tickets/${id}/admin-status`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Master Data
  getCategories: () => request('/categories'),
  getLocations: () => request('/locations'),
  getTechnicians: () => request('/technicians'),

  // Reports
  getSummaryReports: () => request('/reports/summary'),
  getReportsByBuilding: () => request('/reports/by-building'),
  getReportsByCategory: () => request('/reports/by-category'),
  getTechnicianWorkload: () => request('/reports/technician-workload'),
  getRecentActivity: () => request('/reports/recent-activity'),

  // DBMS Schema Inspector
  getSchemaInfo: () => request('/schema/info'),
  runSqlQuery: (sql) => request('/schema/query', { method: 'POST', body: JSON.stringify({ sql }) }),

  // Health
  getHealth: () => request('/health')
};
