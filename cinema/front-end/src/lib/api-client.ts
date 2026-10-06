
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

let refreshPromise: Promise<boolean> | null = null;

const isAuthEndpoint = (url?: string) => {
    if (!url) return false;

    return (
        url === '/auth/login' ||
        url === '/auth/register' ||
        url === '/auth/google' ||
        url === '/auth/refresh' ||
        url === '/auth/logout'
    );
};

const refreshAccessToken = async (): Promise<boolean> => {
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = apiClient
        .post('/auth/refresh')
        .then(() => true)
        .catch(() => false)
        .finally(() => {
            refreshPromise = null;
        });

    return refreshPromise;
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig | undefined;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        if (error.response?.status !== 401) {
            return Promise.reject(error);
        }

        if (isAuthEndpoint(originalRequest.url)) {
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        const refreshed = await refreshAccessToken();

        if (!refreshed) {
            return Promise.reject(error);
        }

        return apiClient(originalRequest);
    },
);

