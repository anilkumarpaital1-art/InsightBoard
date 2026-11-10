
import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const getDashboardStats = async (
  range = "12m",
  startDate = null,
  endDate = null
) => {
  const params =
    range === "custom"
      ? { startDate, endDate }
      : { range };

  const response = await API.get("/dashboard", { params });

  return response.data;
};