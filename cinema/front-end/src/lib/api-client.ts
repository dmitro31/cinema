import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 🔄 Перехоплювач запитів: автоматично додає Access Token з локального сховища
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

const isAuthEndpoint = (url?: string) => {
  if (!url) return false;
  return url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/google') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/logout');
};

// Функція оновлення токена (надсилає старий токен у тілі запиту, якщо куки заблоковані)
const refreshAccessToken = async (): Promise<string | null> => {
  if (refreshPromise) return refreshPromise;

  const currentRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

  refreshPromise = axios
    .post(
      `${API_URL.replace(/\/+$/, '')}/auth/refresh`, 
      { refreshToken: currentRefreshToken }, // Передаємо в Body на випадок блокування кук браузером
      { withCredentials: true }
    )
    .then((res) => {
      const { accessToken, refreshToken } = res.data;
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      return accessToken || null;
    })
    .catch(() => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
      return null;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// Перехоплювач відповідей: якщо ловимо 401 — тихо оновлюємо токен
apiClient.interceptors.response.use(
  (response) => {
    // Якщо це запит логіну/реєстрації/гугла — зберігаємо токени з відповіді
    if (response.config.url && isAuthEndpoint(response.config.url) && response.data) {
      const { accessToken, refreshToken } = response.data;
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401 || isAuthEndpoint(originalRequest.url) || originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      return Promise.reject(error);
    }

    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
    }

    return apiClient(originalRequest);
  },
);
