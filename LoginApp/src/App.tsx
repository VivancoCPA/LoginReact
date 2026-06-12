import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import RecoverPassword from './pages/RecoverPassword';
import ForcePasswordChange from './pages/ForcePasswordChange';
import MainLayout from './layouts/MainLayout';
import UserMaintenance from './pages/UserMaintenance';
import RoleMaintenance from './pages/RoleMaintenance';
import InsurerMaintenance from './pages/InsurerMaintenance';
import SpecialtyMaintenance from './pages/SpecialtyMaintenance';
import CenterTypeMaintenance from './pages/CenterTypeMaintenance';
import MedicalCenterMaintenance from './pages/MedicalCenterMaintenance';
import DoctorMaintenance from './pages/DoctorMaintenance';
import FamilyGroupMaintenance from './pages/FamilyGroupMaintenance';
import ChooseRole from './pages/ChooseRole';

// Route Guard: Protected paths requiring authentication
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, user, isLoading, checkTokenExpiry, logout, activeRole } = useAuth();
  const location = useLocation();

  React.useEffect(() => {
    if (isAuthenticated) {
      const isExpired = checkTokenExpiry();
      if (isExpired) {
        logout("Su sesión ha expirado. Por favor, inicie sesión nuevamente.");
      }
    }
  }, [isAuthenticated, checkTokenExpiry, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If the user has a pending password change forced status
  if (user?.passwordConfirmed === false) {
    if (location.pathname !== '/force-password-change') {
      return <Navigate to="/force-password-change" replace />;
    }
  } else {
    // Fully confirmed users cannot access force-password-change
    if (location.pathname === '/force-password-change') {
      return <Navigate to="/dashboard" replace />;
    }

    const roles = user?.roles || [];
    const hasMultipleRoles = roles.length > 1;
    const hasZeroRoles = roles.length === 0;

    if (hasZeroRoles || (hasMultipleRoles && !activeRole)) {
      if (location.pathname !== '/choose-role') {
        return <Navigate to="/choose-role" replace />;
      }
    } else {
      if (location.pathname === '/choose-role') {
        return <Navigate to="/dashboard" replace />;
      }
    }
  }

  return children;
};

// Route Guard: Public paths (like login) that authenticated users should not visit
const PublicRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, user, isLoading, activeRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.passwordConfirmed === false) {
      return <Navigate to="/force-password-change" replace />;
    }
    const roles = user?.roles || [];
    if (roles.length === 0 || (roles.length > 1 && !activeRole)) {
      return <Navigate to="/choose-role" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const App: React.FC = () => {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    let activeTheme: 'light' | 'dark' = 'dark';
    if (savedTheme === 'light' || savedTheme === 'dark') {
      activeTheme = savedTheme;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      activeTheme = 'dark';
    } else {
      activeTheme = 'light';
    }

    const root = window.document.documentElement;
    if (activeTheme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <RecoverPassword />
              </PublicRoute>
            }
          />
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin/users" element={<UserMaintenance />} />
            <Route path="/admin/roles" element={<RoleMaintenance />} />
            <Route path="/admin/insurances" element={<InsurerMaintenance />} />
            <Route path="/admin/specialties" element={<SpecialtyMaintenance />} />
            <Route path="/admin/center-types" element={<CenterTypeMaintenance />} />
            <Route path="/admin/medical-centers" element={<MedicalCenterMaintenance />} />
            <Route path="/admin/doctors" element={<DoctorMaintenance />} />
            <Route path="/patients/family-group" element={<FamilyGroupMaintenance />} />
          </Route>
          <Route
            path="/force-password-change"
            element={
              <ProtectedRoute>
                <ForcePasswordChange />
              </ProtectedRoute>
            }
          />
          <Route
            path="/choose-role"
            element={
              <ProtectedRoute>
                <ChooseRole />
              </ProtectedRoute>
            }
          />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
