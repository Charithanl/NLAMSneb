import axios from "axios";
import { getApiBaseUrl } from "../utils/env";

export { getApiBaseUrl } from "../utils/env";

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("nlams.accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);
