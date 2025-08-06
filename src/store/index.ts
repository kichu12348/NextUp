import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

export interface User {
  email: string;
  name: string;
  college?: string;
  gender?: string; // Added gender
  totalPoints: number;
  taskCount: number;
}

export interface Submission {
  id: string;
  taskName: string;
  taskType: 'CHALLENGE' | 'MENTOR_SESSION' | 'POWERUP_CHALLENGE' | 'EASTER_EGG';
  fileUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  points?: number;
  note?: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  validateToken: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      login: (token, userData) =>
        set({
          token,
          user: userData,
          isAuthenticated: true,
        }),
      logout: () => {
        // Clear both tokens from localStorage
        localStorage.removeItem('participant-token');
        localStorage.removeItem('admin-token');
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },
      setUser: (user) => set((state) => ({ user: { ...state.user, ...user } })),
      setLoading: (loading) => set({ isLoading: loading }),
      validateToken: async () => {
        try {
          const participantToken = localStorage.getItem('participant-token');
          if (!participantToken) {
            get().logout();
            return false;
          }

          const response = await authAPI.validateParticipantToken();
          if (response.data.valid && response.data.participant) {
            // Update user data from token validation
            set({
              user: {
                email: response.data.participant.email,
                name: response.data.participant.name,
                college: response.data.participant.college,
                gender: response.data.participant.gender, // Added gender
                totalPoints: response.data.participant.totalPoints,
                taskCount: response.data.participant.taskCount,
              },
              token: participantToken,
              isAuthenticated: true,
            });
            return true;
          } else {
            get().logout();
            return false;
          }
        } catch (error) {
          console.error('Token validation failed:', error);
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

interface SubmissionState {
  submissions: Submission[];
  selectedSubmission: Submission | null;
  isLoading: boolean;
  setSubmissions: (submissions: Submission[]) => void;
  setSelectedSubmission: (submission: Submission | null) => void;
  setLoading: (loading: boolean) => void;
  addSubmission: (submission: Submission) => void;
  updateSubmission: (id: string, updates: Partial<Submission>) => void;
}

export const useSubmissionStore = create<SubmissionState>((set) => ({
  submissions: [],
  selectedSubmission: null,
  isLoading: false,
  setSubmissions: (submissions) => set({ submissions }),
  setSelectedSubmission: (submission) => set({ selectedSubmission: submission }),
  setLoading: (loading) => set({ isLoading: loading }),
  addSubmission: (submission) =>
    set((state) => ({
      submissions: [...state.submissions, submission],
    })),
  updateSubmission: (id, updates) =>
    set((state) => ({
      submissions: state.submissions.map((sub) =>
        sub.id === id ? { ...sub, ...updates } : sub
      ),
    })),
}));