import { useAuth } from "../context/AuthContext";
import { useCallback, useEffect, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
  Package,
} from "lucide-react";
import "../styles/Products.css";

import DataGrid from "../components/DataGrid";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
} from "../services/productService";

const emptyForm = {
  name: "",
  category: "",
  description: "",
  price: "",
  stock: 0,
  status: "Active",
};

const statusStyles = {
  Active: { color: "#15803d", background: "#e8f8ee" },
  Inactive: { color: "#64748b", background: "#eef1f5" },
  "Out of Stock": { color: "#dc2626", background: "#feecec" },
};

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  // Bulk delete states
const [selectedIds, setSelectedIds] = useState([]);
const [bulkDeleting, setBulkDeleting] = useState(false);
const [hoveredProductId, setHoveredProductId] = useState(null);

// Get selected product records for CSV and Excel export
const selectedProducts = products.filter((product) =>
  selectedIds.includes(product._id)
);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getProducts({
        search,
        status,
        page,
        limit: 8,
        sortBy: "createdAt",
        order: "desc",
      });

      setProducts(data.products || []);
      setTotalProducts(data.totalProducts || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load products. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      category: product.category || "",
      description: product.description || "",
      price: product.price ?? "",
      stock: product.stock ?? 0,
      status: product.status || "Active",
    });
    setMessage("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      form.price === "" ||
      Number(form.price) < 0 ||
      Number(form.stock) < 0
    ) {
      setMessage("Please enter valid product details.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        ...form,
        name: form.name.trim(),
        category: form.category.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        setMessage("Product updated successfully.");
      } else {
        await createProduct(payload);
        setMessage("Product created successfully.");
      }

      setShowModal(false);
      setForm(emptyForm);
      await loadProducts();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Unable to save this product."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
  setError("");
  setMessage("");

  await deleteProduct(id);

  setSelectedIds((previous) =>
    previous.filter((selectedId) => selectedId !== id)
  );

  setMessage("Product deleted successfully.");

  if (products.length === 1 && page > 1) {
    setPage((previous) => previous - 1);
  } else {
    await loadProducts();
  }
}  catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this product."
      );
    }
  };

const handleBulkDelete = async () => {
  if (selectedIds.length === 0) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete ${selectedIds.length} selected products?`
  );

  if (!confirmed) return;

  const allCurrentPageProductsSelected =
    products.length > 0 &&
    products.every((product) =>
      selectedIds.includes(product._id)
    );

  try {
    setBulkDeleting(true);
    setError("");
    setMessage("");

    const result = await bulkDeleteProducts(selectedIds);

    setMessage(
      result.message || "Selected products deleted successfully."
    );

    setSelectedIds([]);

    if (allCurrentPageProductsSelected && page > 1) {
      setPage((previous) => previous - 1);
    } else {
      await loadProducts();
    }
  } catch (err) {
    setError(
      err.response?.data?.message || "Bulk deletion failed."
    );
  } finally {
    setBulkDeleting(false);
  }
};

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);


const handleSelectAll = (checked) => {
  const currentPageIds = products.map((product) => product._id);

  setSelectedIds((previous) =>
    checked
      ? [...new Set([...previous, ...currentPageIds])]
      : previous.filter((id) => !currentPageIds.includes(id))
  );
};


const columns = [
  ...(isAdmin
    ? [
        {
          id: "select",
          header: () => (
            <input
              type="checkbox"
              aria-label="Select all products"
              checked={
                products.length > 0 &&
                products.every((product) =>
                  selectedIds.includes(product._id)
                )
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
            />
          ),
          enableSorting: false,
          cell: ({ row }) => {
            const product = row.original;
            const isSelected = selectedIds.includes(product._id);

            return (
              <input
                type="checkbox"
                aria-label={`Select ${product.name}`}
                checked={isSelected}
                onChange={(e) => {
                  setSelectedIds((previous) =>
                    e.target.checked
                      ? [...new Set([...previous, product._id])]
                      : previous.filter((id) => id !== product._id)
                  );
                }}
                style={{
                  opacity:
                    hoveredProductId === product._id || isSelected ? 1 : 0,
                  cursor: "pointer",
                  width: "16px",
                  height: "16px",
                  transition: "opacity 0.2s ease",
                }}
              />
            );
          },
        },
      ]
    : []),

  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => (
      <div>
        <strong>{row.original.name}</strong>
        <div
          style={{
            color: "#8791a5",
            fontSize: "12px",
            marginTop: "4px",
          }}
        >
          {row.original.description || "No description"}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => (
      <strong>{money(row.original.price)}</strong>
    ),
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const product = row.original;

      return (
        <span
          style={{
            ...(statusStyles[product.status] || statusStyles.Active),
            padding: "6px 10px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {product.status}
        </span>
      );
    },
  },

  ...(isAdmin
    ? [
        {
          id: "actions",
          header: "Actions",
          enableSorting: false,
          cell: ({ row }) => {
            const product = row.original;

            return (
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => openEditModal(product)}
                  title="Edit product"
                  style={{
                    ...buttonStyle,
                    padding: "8px",
                    background: "#eef2ff",
                    color: "#3157d5",
                  }}
                >
                  <Pencil size={15} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(product._id)}
                  title="Delete product"
                  style={{
                    ...buttonStyle,
                    padding: "8px",
                    background: "#fff0f0",
                    color: "#dc2626",
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            );
          },
        },
      ]
    : []),
];


  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #dfe3eb",
    borderRadius: "8px",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    background: "#fff",
    color: "#263247",
  };

  const buttonStyle = {
    border: "none",
    borderRadius: "8px",
    padding: "10px 14px",
    cursor: "pointer",
    fontWeight: 600,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
  };

  return (
    <div style={{ color: "#263247", padding: "24px" }}>
      {/* Heading */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "15px",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 700 }}>
            Products Management
          </h2>
          <p style={{ color: "#8791a5", margin: "7px 0 0", fontSize: "14px" }}>
            Manage your product catalogue and inventory.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
  {isAdmin && (
  <button
    onClick={openAddModal}
    style={{
      ...buttonStyle,
      background: "#3157d5",
      color: "#fff",
      padding: "12px 17px",
    }}
  >
    <Plus size={17} />
    Add Product
  </button>
)}

  {isAdmin && selectedIds.length > 0 && (
    <button
      onClick={handleBulkDelete}
      disabled={bulkDeleting}
      style={{
        ...buttonStyle,
        background: "#dc2626",
        color: "#fff",
        padding: "12px 17px",
      }}
    >
      <Trash2 size={17} />
      {bulkDeleting
        ? "Deleting..."
        : `Delete Selected (${selectedIds.length})`}
    </button>
  )}
</div>
</div>

      {/* Product summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
          background: "#fff",
          border: "1px solid #edf0f5",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            width: "45px",
            height: "45px",
            display: "grid",
            placeItems: "center",
            borderRadius: "10px",
            background: "#eef2ff",
            color: "#3157d5",
          }}
        >
          <Package size={22} />
        </div>
        <div>
          <div style={{ color: "#8791a5", fontSize: "13px" }}>
            Total Products
          </div>
          <div style={{ fontSize: "27px", fontWeight: 700, marginTop: "4px" }}>
            {totalProducts}
          </div>
          {!isAdmin && (
  <p style={{ color: "#64748b", fontSize: "13px" }}>
    Viewer Mode: You have read-only access.
  </p>
)}
        </div>
      </div>

      {/* Search and filters */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        <div style={{ position: "relative", flex: "1 1 250px" }}>
          <Search
            size={17}
            color="#8791a5"
            style={{
              position: "absolute",
              left: "12px",
              top: "12px",
            }}
          />
          <input
            value={search}
            onChange={(e) => {
  setSearch(e.target.value);
  setSelectedIds([]);
  setPage(1);
}}
            placeholder="Search product or category..."
            style={{ ...inputStyle, paddingLeft: "38px" }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
  setStatus(e.target.value);
  setSelectedIds([]);
  setPage(1);
}}
          style={{ ...inputStyle, width: "180px" }}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        <button
          onClick={loadProducts}
          style={{
            ...buttonStyle,
            background: "#eef2ff",
            color: "#3157d5",
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: "11px 14px",
            background: "#edf8f0",
            color: "#18733b",
            borderRadius: "8px",
            marginBottom: "14px",
            fontSize: "14px",
          }}
        >
          {message}
          <button
            onClick={() => setMessage("")}
            style={{
              float: "right",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "12px",
            background: "#fff0f0",
            color: "#c62828",
            borderRadius: "8px",
            marginBottom: "14px",
          }}
        >
          {error}
          <button
            onClick={loadProducts}
            style={{
              marginLeft: "12px",
              border: "none",
              background: "transparent",
              color: "inherit",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Products DataGrid */}
<div
  style={{
    background: "#fff",
    border: "1px solid #edf0f5",
    borderRadius: "12px",
    padding: "20px",
    overflowX: "auto",
  }}
>
  <DataGrid
    columns={columns}
    data={products}
    selectedRows={selectedProducts}
    exportFileName="products"
    loading={loading}
    page={page}
    totalPages={totalPages}
    onPageChange={setPage}
    showSearch={false}
    emptyMessage="No products found. Add your first product."
    onRowMouseEnter={(product) =>
      setHoveredProductId(product._id)
    }
    onRowMouseLeave={() =>
      setHoveredProductId(null)
    }
  />

  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      marginTop: "18px",
      color: "#8791a5",
      fontSize: "13px",
    }}
  >
    Showing {products.length} of {totalProducts} products
  </div>
</div>

      {/* Add/Edit modal */}
      {showModal && isAdmin && (
        <div
          onClick={() => !saving && setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#fff",
              borderRadius: "14px",
              padding: "25px",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "22px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "20px" }}>
                {editingId ? "Edit Product" : "Add New Product"}
              </h3>

              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {message && (
              <p style={{ color: "#c62828", fontSize: "13px" }}>{message}</p>
            )}

            <form onSubmit={handleSubmit}>
              {[
                { label: "Product Name", name: "name", type: "text" },
                { label: "Category", name: "category", type: "text" },
                { label: "Price (₹)", name: "price", type: "number" },
                { label: "Stock Quantity", name: "stock", type: "number" },
              ].map((field) => (
                <div key={field.name} style={{ marginBottom: "15px" }}>
                  <label
                    style={{
                      display: "block",
                      marginBottom: "7px",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {field.label}
                  </label>

                  <input
                    required
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    min="0"
                    step={field.name === "price" ? "0.01" : "1"}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div style={{ marginBottom: "15px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Product Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  style={{
                    ...buttonStyle,
                    background: "#f0f2f6",
                    color: "#475569",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    ...buttonStyle,
                    background: "#3157d5",
                    color: "#fff",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Product"
                    : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
