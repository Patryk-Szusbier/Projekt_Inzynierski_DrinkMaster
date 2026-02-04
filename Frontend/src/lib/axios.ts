import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import { toast } from "sonner";

type ApiRequestConfig = AxiosRequestConfig & {
  silentError?: boolean;
};

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

const getErrorMessage = (error: AxiosError | Error) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { message?: string; error?: string; detail?: string }
      | string
      | undefined;

    const fromBody =
      typeof data === "string"
        ? data
        : data?.message || data?.error || data?.detail;

    if (fromBody) return fromBody;
    if (error.code === "ECONNABORTED") {
      return "Przekroczono limit czasu połączenia z serwerem.";
    }
    if (!error.response) {
      return "Brak połączenia z serwerem. Sprawdź internet lub spróbuj ponownie.";
    }
    if (status === 401) {
      return "Brak autoryzacji. Zaloguj się ponownie.";
    }
    if (status === 403) {
      return "Brak uprawnień do wykonania tej operacji.";
    }
    if (status === 404) {
      return "Nie znaleziono zasobu.";
    }
    if (status && status >= 500) {
      return "Błąd serwera. Spróbuj ponownie później.";
    }
  }

  return "Wystąpił nieoczekiwany błąd.";
};

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error?.config as ApiRequestConfig | undefined;
    if (!config?.silentError) {
      toast.error(getErrorMessage(error));
    }
    return Promise.reject(error);
  }
);

const api = {
  get: <T = unknown>(url: string, config?: ApiRequestConfig) =>
    instance.get<T>(url, config).then((res) => res.data),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: ApiRequestConfig
  ) => instance.post<T>(url, data, config).then((res) => res.data),

  put: <T = unknown>(
    url: string,
    data?: unknown,
    config?: ApiRequestConfig
  ) => instance.put<T>(url, data, config).then((res) => res.data),

  delete: <T = unknown>(url: string, config?: ApiRequestConfig) =>
    instance.delete<T>(url, config).then((res) => res.data),
};

export default api;
