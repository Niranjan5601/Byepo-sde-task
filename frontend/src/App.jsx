import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import { SuperAdminLogin, SuperAdminDashboard } from './pages/SuperAdmin';
import { AdminAuth, AdminDashboard } from './pages/Admin';
import { UserAuth, UserDashboard } from './pages/User';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/super-admin" element={<SuperAdminLogin />} />
          <Route
            path="/super-admin/dashboard"
            element={
              <ProtectedRoute requiredRole="super_admin" redirectTo="/super-admin">
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/admin" element={<AdminAuth />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="org_admin" redirectTo="/admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/user" element={<UserAuth />} />
          <Route
            path="/user/dashboard"
            element={
              <ProtectedRoute requiredRole="end_user" redirectTo="/user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
