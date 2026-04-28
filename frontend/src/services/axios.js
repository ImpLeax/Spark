import axios from 'axios'
import i18n from '@/i18n'

let inMemoryAccessToken = null;

export const setAccessToken = (token) => {
  inMemoryAccessToken = token;
};

export const getAccessToken = () => {
  return inMemoryAccessToken;
};

const rawBaseUrl = import.meta.env.VITE_BACKEND_URL || '';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/v1/`,
    withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Accept-Language'] = i18n.language || 'en';

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== 'user/token/refresh/'
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/user/token/refresh/`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = response.data.access;
        setAccessToken(newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        setAccessToken(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;