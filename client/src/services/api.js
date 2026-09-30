const BASE_URL = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';
const API_AUTH = `${BASE_URL}/api/auth`;
const API_TASKS = `${BASE_URL}/api/tasks`;

const TOKEN_KEY = 'mytasks_token';
const getToken = () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem('mern_task_token');
const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.removeItem('mern_task_token');
};
const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('mern_task_token');
};

const getHeaders = (includeAuth = true) => {
  const headers = { 'Content-Type': 'application/json' };
  if (includeAuth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  getToken,
  setToken,
  removeToken,

  // Auth
  async signup(userData) {
    const res = await fetch(`${API_AUTH}/signup`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Signup failed');
    if (json.token) setToken(json.token);
    return json;
  },

  async login(credentials) {
    const res = await fetch(`${API_AUTH}/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(credentials),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');
    if (json.token) setToken(json.token);
    return json;
  },

  async getMe() {
    const token = getToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_AUTH}/me`, {
        headers: getHeaders(true),
      });
      if (!res.ok) {
        removeToken();
        return null;
      }
      const json = await res.json();
      return json.user || null;
    } catch {
      return null;
    }
  },

  // Tasks
  async fetchTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${API_TASKS}?${query}` : API_TASKS;
    const res = await fetch(url, {
      headers: getHeaders(true),
    });
    if (res.status === 401) {
      removeToken();
      throw new Error('Session expired, please sign in again');
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch tasks');
    }
    const json = await res.json();
    return Array.isArray(json) ? json : json.data || [];
  },

  async createTask(taskData) {
    const res = await fetch(API_TASKS, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(taskData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to create task');
    return json.data || json;
  },

  async updateTask(id, updateData) {
    const res = await fetch(`${API_TASKS}/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updateData),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update task');
    return json.data || json;
  },

  async deleteTask(id) {
    const res = await fetch(`${API_TASKS}/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete task');
    return json.data || json;
  },

  // Admin API Endpoints
  async getAdminStats() {
    const res = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch admin stats');
    return json.data;
  },

  async getAdminUsers(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${BASE_URL}/api/admin/users${query}`, {
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch admin users');
    return json.data || [];
  },

  async updateUserRole(userId, role) {
    const res = await fetch(`${BASE_URL}/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ role }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to update user role');
    return json.data;
  },

  async deleteAdminUser(userId) {
    const res = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete user');
    return json;
  },

  async getAdminTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${BASE_URL}/api/admin/tasks?${query}` : `${BASE_URL}/api/admin/tasks`;
    const res = await fetch(url, {
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch platform tasks');
    return json.data || [];
  },

  async deleteAdminTask(taskId) {
    const res = await fetch(`${BASE_URL}/api/admin/tasks/${taskId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete task');
    return json;
  },

  async claimAdmin() {
    const res = await fetch(`${BASE_URL}/api/admin/claim-admin`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to claim admin status');
    return json.user;
  },
};