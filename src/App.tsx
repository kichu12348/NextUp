import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { authAPI } from './services/api';
import { useEffect, useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Task from './pages/Task';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminSubmissions from './pages/AdminSubmissions';
import Leaderboard from './pages/Leaderboard';
import './App.css';
import { FaHeart } from 'react-icons/fa';

// App-level auth state
interface AppAuthState {
  isInitialized: boolean;
  participantAuth: boolean;
  adminAuth: boolean;
}

function App() {
  const { validateToken, logout } = useAuthStore();
  const [appAuth, setAppAuth] = useState<AppAuthState>({
    isInitialized: false,
    participantAuth: false,
    adminAuth: false
  });

  useEffect(() => {
    const initializeAuth = async () => {
      const participantToken = localStorage.getItem('participant-token');
      const adminToken = localStorage.getItem('admin-token');
      
      let participantValid = false;
      let adminValid = false;

      // Validate participant token if exists
      if (participantToken) {
        try {
          const isValid = await validateToken();
          participantValid = isValid;
        } catch (error) {
          console.error('Participant token validation failed:', error);
          localStorage.removeItem('participant-token');
          logout();
        }
      }

      // Validate admin token if exists
      if (adminToken) {
        try {
          const response = await authAPI.validateAdminToken();
          adminValid = response.data.valid;
          if (!adminValid) {
            localStorage.removeItem('admin-token');
          }
        } catch (error) {
          console.error('Admin token validation failed:', error);
          localStorage.removeItem('admin-token');
        }
      }

      setAppAuth({
        isInitialized: true,
        participantAuth: participantValid,
        adminAuth: adminValid
      });
    };

    initializeAuth();
  }, [validateToken, logout]);

  // Show loading screen during initial auth check
  if (!appAuth.isInitialized) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        backgroundColor: 'white',
        color: 'black'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

// Protected Route Component - now just checks auth state
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin Protected Route Component - uses app-level admin auth
const AdminProtectedRoute = ({ children, adminAuth }: { children: React.ReactNode; adminAuth: boolean }) => {
  return adminAuth ? <>{children}</> : <Navigate to="/admin/login" replace />;
};

// Admin Public Route Component - uses app-level admin auth
const AdminPublicRoute = ({ children, adminAuth }: { children: React.ReactNode; adminAuth: boolean }) => {
  return !adminAuth ? <>{children}</> : <Navigate to="/admin" replace />;
};

// Public Route Component - checks participant auth
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuthStore();
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

  return (
    <>
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Public Leaderboard Route */}
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* Admin Routes */}
          <Route 
            path="/admin/login" 
            element={
              <AdminPublicRoute adminAuth={appAuth.adminAuth}>
                <AdminLogin />
              </AdminPublicRoute>
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              <AdminProtectedRoute adminAuth={appAuth.adminAuth}>
                <AdminDashboard />
              </AdminProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/submissions" 
            element={
              <AdminProtectedRoute adminAuth={appAuth.adminAuth}>
                <AdminSubmissions />
              </AdminProtectedRoute>
            } 
          />

          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/task" 
            element={
              <ProtectedRoute>
                <Task />
              </ProtectedRoute>
            } 
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
    <div style={{ textAlign: 'center', margin: '20px 0' }}>
      <p>Made Wid <FaHeart color='red'/> by Kichu</p>
    </div>
    </>
  );
}

export default App;
