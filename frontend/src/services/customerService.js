
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

// Get customers with pagination, search and filters
export const getCustomers = async (params = {}) => {
  const response = await API.get("/customers", { params });
  return response.data;
};

// Create a customer
export const createCustomer = async (customerData) => {
  const response = await API.post("/customers", customerData);
  return response.data;
};

// Update a customer
export const updateCustomer = async (id, customerData) => {
  const response = await API.patch(
    `/customers/${id}`,
    customerData
  );
  return response.data;
};

// Delete a customer
export const deleteCustomer = async (id) => {
  const response = await API.delete(`/customers/${id}`);
  return response.data;
};

// Bulk delete customers
export const bulkDeleteCustomers = async (ids) => {
  const response = await API.delete("/customers/bulk", {
    data: { ids }
  });
  return response.data;
};
