import Cookies from 'js-cookie';
import { User } from '../types/interfaces';

const cookieOptions = {
  expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  httpOnly: false,
  secure: true,
};
export const storage = {
  storeToken(token: string) {
    Cookies.set('token', token, cookieOptions);
  },
  clearToken() {
    Cookies.remove('token');
  },
  getToken() {
    return Cookies.get('token');
  },
};
