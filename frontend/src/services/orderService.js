
import axios from "axios";

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Automatically attach JWT token to every request
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

// Get orders with pagination, search and filters
export const getOrders = async (params = {}) => {
  const response = await API.get("/orders", { params });
  return response.data;
};

// Get all orders for CSV and Excel export
export const getAllOrders = async (params = {}) => {
  const response = await API.get("/orders", {
    params: {
      ...params,
      all: true,
    },
  });

  return response.data;
};

// Create an order
export const createOrder = async (orderData) => {
  const response = await API.post("/orders", orderData);
  return response.data;
};

// Update an order
export const updateOrder = async (id, orderData) => {
  const response = await API.patch(`/orders/${id}`, orderData);
  return response.data;
};

// Delete an order
export const deleteOrder = async (id) => {
  const response = await API.delete(`/orders/${id}`);
  return response.data;
};

// Bulk delete orders
export const bulkDeleteOrders = async (ids) => {
  const response = await API.delete("/orders/bulk", {
    data: { ids }
  });
  return response.data;
};
