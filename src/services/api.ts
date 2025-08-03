import axios from 'axios';


const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor for adding auth headers
api.interceptors.request.use(
  (config) => {
    // Check for admin token first
    const adminToken = localStorage.getItem('admin-token');
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
      return config;
    }

    // Check for participant token
    const participantToken = localStorage.getItem('participant-token');
    if (participantToken) {
      config.headers.Authorization = `Bearer ${participantToken}`;
      return config;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear both tokens on 401
      localStorage.removeItem('admin-token');
      localStorage.removeItem('participant-token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface SubmissionCreateData {
  taskType: 'CHALLENGE' | 'MENTOR_SESSION' | 'POWERUP_CHALLENGE' | 'EASTER_EGG';
  taskName: string;
  fileUrl: string;
}

export interface OTPRequestData {
  email: string;
  name?: string;
  college?: string;
  gender?: string;
}

export interface OTPVerifyData {
  email: string;
  otp: string;
}

export interface TaskCreateData {
  name: string;
  description: string;
  type: 'CHALLENGE' | 'MENTOR_SESSION' | 'POWERUP_CHALLENGE' | 'EASTER_EGG';
  points: number;
  isVariablePoints: boolean;
}

export const authAPI = {
  checkAdmin: (email: string) => api.post('/auth/check-admin', { email }),
  requestOTP: (data: OTPRequestData) => api.post('/auth/request-otp', data),
  verifyOTP: (data: OTPVerifyData) => api.post('/auth/verify-otp', data),
  validateAdminToken: () => api.get('/auth/validate-admin-token'),
  validateParticipantToken: () => api.get('/auth/validate-participant-token'),
};

export const participantAPI = {
  requestOTP: (data: OTPRequestData) => api.post('/participant/request-otp', data),
  verifyOTP: (data: OTPVerifyData) => api.post('/participant/verify-otp', data),
};

export const adminAPI = {
  createTask: (data: TaskCreateData) => api.post('/admin/tasks', data),
  getTasks: () => api.get('/admin/tasks'),
  updateTask: (id: string, data: Partial<TaskCreateData>) => api.put(`/admin/tasks/${id}`, data),
  deleteTask: (id: string) => api.delete(`/admin/tasks/${id}`),
  getStats: () => api.get('/admin/tasks/stats'),
  getSubmissions: (params?: { page?: number; limit?: number; status?: string; taskType?: string; email?: string }) => 
    api.get('/admin/submissions', { params }),
  updateSubmission: (id: string, data: { status?: 'PENDING' | 'APPROVED' | 'REJECTED'; points?: number; note?: string }) =>
    api.patch(`/admin/submissions/${id}`, data),
  getExcelSheet: () => api.get("/admin/export/excel", { responseType: 'blob' }),
  getParticipants: () => api.get("/admin/export/participants"),
};

export const submissionAPI = {
  create: (data: { taskType: string; taskName: string; fileUrl: string }) => api.post('/submissions', data),
  getMySubmissions: () => api.get('/submissions/my-submissions'),
};

export const leaderboardAPI = {
  get: (page = 1, limit = 50) => 
    api.get(`/leaderboard?page=${page}&limit=${limit}`),
};

export const tasksAPI = {
  getAll: () => api.get('/tasks'),
};

export default api;
