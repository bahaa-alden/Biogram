export const storage = {
  storeToken(token: string) {
    localStorage.setItem('token', token);
  },
  clearToken() {
    localStorage.setItem('token', '');
  },
  getToken() {
    return localStorage.getItem('token');
  },
};
