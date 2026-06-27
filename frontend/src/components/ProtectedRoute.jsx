import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Role ID mapping
const ROLE_IDS = {
  super_admin: 1,
  org_admin: 2,
  end_user: 3,
};

export default function ProtectedRoute({ children, requiredRole, redirectTo }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  if (requiredRole) {
    const requiredRoleId = ROLE_IDS[requiredRole];
    if (user.role_id !== requiredRoleId) {
      return <Navigate to={redirectTo} replace />;
    }
  }

  return children;
}
