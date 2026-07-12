import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT Authorization token into headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle JWT expiration (401 response)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Redirect to login page if unauthorized
      if (
        window.location.pathname !== '/login' && 
        window.location.pathname !== '/register'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    if (res.data && res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    return res.data;
  },
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data && res.data.token) {
      localStorage.setItem('token', res.data.token);
    }
    return res.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const resumeService = {
  upload: async (files, onUploadProgress) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('resumes', files[i]);
    }
    const res = await api.post('/resumes/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return res.data;
  },
  getAll: async (search = '', skill = '') => {
    const params = {};
    if (search) params.search = search;
    if (skill) params.skill = skill;
    const res = await api.get('/resumes', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/resumes/${id}`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/resumes/${id}`);
    return res.data;
  },
};

export const jobService = {
  create: async (jobData) => {
    const res = await api.post('/jobs', jobData);
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/jobs');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/jobs/${id}`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/jobs/${id}`);
    return res.data;
  },
};

export const comparisonService = {
  create: async (jobDescriptionId, resumeIds) => {
    const res = await api.post('/comparisons', { jobDescriptionId, resumeIds });
    return res.data;
  },
  getAll: async () => {
    const res = await api.get('/comparisons');
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/comparisons/${id}`);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/comparisons/${id}`);
    return res.data;
  },
};

export default api;
