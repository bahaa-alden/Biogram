export const storage = {
  storeToken(token: string) {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },
  clearToken() {
    localStorage.removeItem('token');
  },
  getToken(): string | null {
    const token = localStorage.getItem('token');
    // Return null if token is empty string or null
    return token && token.trim() !== '' ? token : null;
  },
};
