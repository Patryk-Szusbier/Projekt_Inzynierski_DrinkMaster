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

const normalizeBodyMessage = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    const fromItems = value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          const msg = (item as { msg?: unknown }).msg;
          return typeof msg === "string" ? msg : null;
        }
        return null;
      })
      .filter((msg): msg is string => Boolean(msg));
    return fromItems.length ? fromItems.join(", ") : null;
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.detail === "string") return obj.detail;

    const nestedDetail = normalizeBodyMessage(obj.detail);
    if (nestedDetail) return nestedDetail;
  }

  return null;
};

const getErrorMessage = (error: AxiosError | Error) => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const fromBody = normalizeBodyMessage(error.response?.data);

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
