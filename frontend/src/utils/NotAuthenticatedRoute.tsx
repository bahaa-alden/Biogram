import { Navigate, Outlet } from 'react-router-dom';
import { storage } from './storage';

const NotAuthenticatedRoute = () => {
  const token = storage.getToken();
  if (!token) {
    return <Outlet />;
  }
  return <Navigate to="/chats" />;
};
export default NotAuthenticatedRoute;
