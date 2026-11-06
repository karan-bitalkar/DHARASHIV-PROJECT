import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const AdminProtectedRoute = ({ children }) => {
  const { isAdmin } = useAuth();

  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  return children;
};

export default AdminProtectedRoute;
