import { useAuth } from "../context/AuthContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  RefreshCw,
} from "lucide-react";

import DataGrid from "../components/DataGrid";

import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  bulkDeleteOrders,
} from "../services/orderService";

const emptyForm = {
  customerName: "",
  customerEmail: "",
  product: "",
  quantity: 1,
  totalAmount: "",
  status: "Pending",
};

const statusColors = {
  Pending: { color: "#b7791f", background: "#fff7df" },
  Processing: { color: "#2563eb", background: "#eaf2ff" },
  Completed: { color: "#15803d", background: "#e8f8ee" },
  Cancelled: { color: "#dc2626", background: "#feecec" },
};

export default function Orders() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Bulk delete and hover selection states
const [selectedIds, setSelectedIds] = useState([]);
const [bulkDeleting, setBulkDeleting] = useState(false);
const [hoveredOrderId, setHoveredOrderId] = useState(null);

// Get selected order records for CSV and Excel export
const selectedOrders = orders.filter((order) =>
  selectedIds.includes(order._id)
);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getOrders({
        search,
        status,
        page,
        limit: 8,
        sortBy: "createdAt",
        order: "desc",
      });

      setOrders(data.orders || []);
      setTotalOrders(data.totalOrders || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load orders. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    const timer = setTimeout(loadOrders, 300);
    return () => clearTimeout(timer);
  }, [loadOrders]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setForm({
      customerName: item.customerName || "",
      customerEmail: item.customerEmail || "",
      product: item.product || "",
      quantity: item.quantity || 1,
      totalAmount: item.totalAmount ?? "",
      status: item.status || "Pending",
    });
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
      !form.customerName.trim() ||
      !form.customerEmail.trim() ||
      !form.product.trim() ||
      Number(form.quantity) < 1 ||
      Number(form.totalAmount) < 0
    ) {
      setMessage("Please enter valid order details.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        ...form,
        customerName: form.customerName.trim(),
        customerEmail: form.customerEmail.trim(),
        product: form.product.trim(),
        quantity: Number(form.quantity),
        totalAmount: Number(form.totalAmount),
      };

      if (editingId) {
        await updateOrder(editingId, payload);
        setMessage("Order updated successfully.");
      } else {
        await createOrder(payload);
        setMessage("Order created successfully.");
      }

      setShowModal(false);
      setForm(emptyForm);
      await loadOrders();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Unable to save this order."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this order?"
    );

    if (!confirmed) return;

    try {
      await deleteOrder(id);

setSelectedIds((previous) =>
  previous.filter((selectedId) => selectedId !== id)
);

setMessage("Order deleted successfully.");

      if (orders.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await loadOrders();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete this order."
      );
    }
  };

  const changeSearch = (value) => {
  setSearch(value);
  setSelectedIds([]);
  setPage(1);
};

  // Bulk delete selected orders
const handleBulkDelete = async () => {
  if (selectedIds.length === 0) return;

  const confirmed = window.confirm(
    `Are you sure you want to delete ${selectedIds.length} selected orders?`
  );

  if (!confirmed) return;

  try {
    setBulkDeleting(true);
    setError("");

    const result = await bulkDeleteOrders(selectedIds);

    setMessage(result.message || "Selected orders deleted successfully.");

const allCurrentPageOrdersSelected =
  orders.length > 0 &&
  orders.every((item) => selectedIds.includes(item._id));

setSelectedIds([]);

if (allCurrentPageOrdersSelected && page > 1) {
  setPage((previous) => previous - 1);
} else {
  await loadOrders();
}
  } catch (err) {
    setError(
      err.response?.data?.message || "Bulk deletion failed."
    );
  } finally {
    setBulkDeleting(false);
  }
};

  const changeStatus = (value) => {
  setStatus(value);
  setSelectedIds([]);
  setPage(1);
};

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);


const handleSelectAll = (checked) => {
  const currentPageIds = orders.map((item) => item._id);

  setSelectedIds((previous) =>
    checked
      ? [...new Set([...previous, ...currentPageIds])]
      : previous.filter((id) => !currentPageIds.includes(id))
  );
};


const columns = useMemo(
  () => [
    ...(isAdmin
      ? [
          {
            id: "select",
            header: () => (
              <input
                type="checkbox"
                aria-label="Select all orders"
                checked={
                  orders.length > 0 &&
                  orders.every((item) =>
                    selectedIds.includes(item._id)
                  )
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            ),
            enableSorting: false,
            cell: ({ row }) => {
              const item = row.original;
              const isSelected = selectedIds.includes(item._id);

              return (
                <input
                  type="checkbox"
                  aria-label={`Select order for ${item.customerName}`}
                  checked={isSelected}
                  onChange={(e) => {
                    setSelectedIds((previous) =>
                      e.target.checked
                        ? [...new Set([...previous, item._id])]
                        : previous.filter((id) => id !== item._id)
                    );
                  }}
                />
              );
            },
          },
        ]
      : []),

    {
      accessorKey: "customerName",
      header: "Customer",
      cell: ({ row }) => (
        <div>
          <strong>{row.original.customerName}</strong>
          <div style={{ color: "#8791a5", fontSize: "12px", marginTop: "4px" }}>
            {row.original.customerEmail}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "product",
      header: "Product",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => (
        <strong>{money(row.original.totalAmount)}</strong>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const item = row.original;
        const colors = statusColors[item.status] || statusColors.Pending;

        return (
          <span
            style={{
              ...colors,
              padding: "6px 10px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {item.status}
          </span>
        );
      },
    },
    {
      accessorKey: "orderDate",
      header: "Date",
      cell: ({ row }) => (
        <span style={{ whiteSpace: "nowrap" }}>
          {new Date(
            row.original.orderDate || row.original.createdAt
          ).toLocaleDateString("en-IN")}
        </span>
      ),
    },

    ...(isAdmin
      ? [
          {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row }) => {
              const item = row.original;

              return (
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => openEditModal(item)}
                    title="Edit order"
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
                    onClick={() => handleDelete(item._id)}
                    title="Delete order"
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
  ],
  [isAdmin, orders, selectedIds, handleSelectAll, money]
);



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
      {/* Page heading */}
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
            Orders Management
          </h2>
          <p style={{ color: "#8791a5", margin: "7px 0 0", fontSize: "14px" }}>
            Manage and track all customer orders.
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
    Add Order
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

      {/* Summary */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #edf0f5",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        <div style={{ color: "#8791a5", fontSize: "13px" }}>
          Total Orders
        </div>
        <div style={{ fontSize: "27px", fontWeight: 700, marginTop: "6px" }}>
          {totalOrders}
        </div>
        {!isAdmin && (
  <p style={{ color: "#64748b", fontSize: "13px", marginBottom: 0 }}>
    Viewer Mode: You have read-only access.
  </p>
)}
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
            onChange={(e) => changeSearch(e.target.value)}
            placeholder="Search customer, email or product..."
            style={{ ...inputStyle, paddingLeft: "38px" }}
          />
        </div>

        <select
          value={status}
          onChange={(e) => changeStatus(e.target.value)}
          style={{ ...inputStyle, width: "180px" }}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          onClick={loadOrders}
          style={{
            ...buttonStyle,
            background: "#eef2ff",
            color: "#3157d5",
          }}
          title="Refresh orders"
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
            onClick={loadOrders}
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

      
{/* Orders DataGrid */}
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
    data={orders}
    selectedRows={selectedOrders}
    exportFileName="orders"
    loading={loading}
    error={error}
    page={page}
    totalPages={totalPages}
    onPageChange={setPage}
    showSearch={false}
    emptyMessage="No orders found. Add your first order."
    onRowMouseEnter={(item) =>
      setHoveredOrderId(item._id)
    }
    onRowMouseLeave={() =>
      setHoveredOrderId(null)
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
    Showing {orders.length} of {totalOrders} orders
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
                {editingId ? "Edit Order" : "Add New Order"}
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
                { label: "Customer Name", name: "customerName", type: "text" },
                { label: "Customer Email", name: "customerEmail", type: "email" },
                { label: "Product", name: "product", type: "text" },
                { label: "Quantity", name: "quantity", type: "number" },
                { label: "Total Amount (₹)", name: "totalAmount", type: "number" },
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
                    min={
                      field.name === "quantity"
                        ? "1"
                        : field.name === "totalAmount"
                        ? "0"
                        : undefined
                    }
                    step={field.name === "totalAmount" ? "0.01" : "1"}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "7px",
                    fontSize: "13px",
                    fontWeight: 600,
                  }}
                >
                  Order Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
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
                  {saving ? "Saving..." : editingId ? "Update Order" : "Create Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
