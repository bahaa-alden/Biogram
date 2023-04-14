import { Navigate, Outlet } from 'react-router-dom';
import { storage } from './storage';

const ProtectedRoutes = () => {
  const token = storage.getToken();
  if (token) {
    return <Outlet />;
  }
  return <Navigate to="/" />;
};
export default ProtectedRoutes;
