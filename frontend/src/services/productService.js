
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

// Get products with pagination, search and filters
export const getProducts = async (params = {}) => {
  const response = await API.get("/products", { params });
  return response.data;
};

// Get all products for CSV and Excel export
export const getAllProducts = async (params = {}) => {
  const response = await API.get("/products", {
    params: {
      ...params,
      all: true,
    },
  });

  return response.data;
};

// Create product
export const createProduct = async (productData) => {
  const response = await API.post("/products", productData);
  return response.data;
};

// Update product
export const updateProduct = async (id, productData) => {
  const response = await API.patch(`/products/${id}`, productData);
  return response.data;
};

// Delete product
export const deleteProduct = async (id) => {
  const response = await API.delete(`/products/${id}`);
  return response.data;
};

// Bulk delete products
export const bulkDeleteProducts = async (ids) => {
  const response = await API.delete("/products/bulk", {
    data: { ids }
  });
  return response.data;
};
