import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { ENDPOINT } from '../../constants/endpoint';
import { storage } from '../../utils/storage';

const apiClient: AxiosInstance = axios.create({
  baseURL: `${ENDPOINT}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      const networkError = {
        ...error,
        response: {
          status: 0,
          data: {
            status: 'error',
            message: 'Network error. Please check your connection.',
          },
        },
      };
      return Promise.reject(networkError);
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      storage.clearToken();
      // Only redirect if not already on login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      return Promise.reject(error);
    }

    // Handle other errors - ensure error has proper structure
    const errorResponse = error.response?.data as any;
    if (!errorResponse || !errorResponse.message) {
      const formattedError = {
        ...error,
        response: {
          ...error.response,
          data: {
            status: 'error',
            message:
              error.response?.status === 500
                ? 'Server error. Please try again later.'
                : error.response?.status === 404
                ? 'Resource not found.'
                : error.response?.status === 403
                ? 'You do not have permission to perform this action.'
                : `Request failed with status ${error.response?.status}`,
          },
        },
      };
      return Promise.reject(formattedError);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
