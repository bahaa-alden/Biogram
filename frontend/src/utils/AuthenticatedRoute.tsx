import { Navigate, Outlet } from 'react-router-dom';
import { storage } from './storage';

const AuthenticatedRoute = () => {
  const token = storage.getToken();
  if (token) {
    return <Outlet />;
  }
  return <Navigate to="/" />;
};
export default AuthenticatedRoute;
