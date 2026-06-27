import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4100/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

// Role ID mapping
const ROLE_IDS = {
  super_admin: 1,
  org_admin: 2,
  end_user: 3,
};

// Auth API methods
export const authAPI = {
  signup: async (email, password, organization_id, role) => {
    const role_id = ROLE_IDS[role];
    const res = await api.post('/auth/signup', {
      email,
      password,
      role_id,
      organization_id,
    });
    return res.data;
  },

  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  getOrganizations: async () => {
    const res = await api.get('/auth/organizations');
    return res.data;
  },
};

// Flags API methods
export const flagsAPI = {
  list: async () => {
    const res = await api.get('/flags');
    return res.data;
  },

  create: async (feature_key, description, enabled) => {
    const res = await api.post('/flags', {
      feature_key,
      description,
      enabled,
    });
    return res.data;
  },

  update: async (id, updates) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const res = await api.patch(`/flags/${id}`, {
      ...updates,
      organization_id: user.organization_id,
    });
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/flags/${id}`);
    return res.data;
  },

  check: async (feature_key) => {
    const res = await api.get('/flags/check', {
      params: { feature_key },
    });
    return res.data;
  },
};

// Super Admin API methods
export const superAdminAPI = {
  login: async (email, password) => {
    const res = await api.post('/superadmin/login', { email, password });
    return res.data;
  },

  listOrganizations: async () => {
    const res = await api.get('/superadmin/organizations');
    return res.data;
  },

  createOrganization: async (name) => {
    const res = await api.post('/superadmin/organizations', {
      org_name: name,
    });
    return res.data;
  },
};

export default api;
