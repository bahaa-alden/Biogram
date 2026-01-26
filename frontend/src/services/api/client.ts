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
  (error: unknown) => {
    // Ignore cancelled requests
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }
    
    const axiosError = error as AxiosError;
    
    // Handle network errors
    if (!axiosError.response) {
      const networkError: AxiosError = {
        ...axiosError,
        response: {
          status: 0,
          statusText: 'Network Error',
          headers: {},
          config: axiosError.config || {} as InternalAxiosRequestConfig,
          data: {
            status: 'error',
            message: 'Network error. Please check your connection.',
          },
        },
      } as AxiosError;
      return Promise.reject(networkError);
    }

    // Handle 401 Unauthorized
    if (axiosError.response.status === 401) {
      storage.clearToken();
      // Only redirect if not already on login page
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
      return Promise.reject(axiosError);
    }

    // Handle other errors - ensure error has proper structure
    const errorResponse = axiosError.response.data as any;
    if (!errorResponse || !errorResponse.message) {
      const formattedError: AxiosError = {
        ...axiosError,
        response: {
          ...axiosError.response,
          data: {
            status: 'error',
            message:
              axiosError.response.status === 500
                ? 'Server error. Please try again later.'
                : axiosError.response.status === 404
                ? 'Resource not found.'
                : axiosError.response.status === 403
                ? 'You do not have permission to perform this action.'
                : `Request failed with status ${axiosError.response.status}`,
          },
        },
      } as AxiosError;
      return Promise.reject(formattedError);
    }

    return Promise.reject(axiosError);
  }
);

export default apiClient;
