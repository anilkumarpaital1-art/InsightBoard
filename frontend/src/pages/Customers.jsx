import { useAuth } from "../context/AuthContext";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Search,
  Plus,
  RefreshCw,
  X,
  Edit,
  Trash2,
} from "lucide-react";

import DataGrid from "../components/DataGrid";

import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkDeleteCustomers,
} from "../services/customerService";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "Active",
};

function Customers() {

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCustomers, setTotalCustomers] = useState(0);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [formData, setFormData] = useState(initialForm);

  // Bulk delete and row selection
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [hoveredCustomerId, setHoveredCustomerId] = useState(null);

  // Get selected customer records for CSV and Excel export
const selectedCustomers = customers.filter((customer) =>
  selectedIds.includes(customer._id)
);

  // Fetch customers from MongoDB
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getCustomers({
        search,
        status,
        page,
        limit: 5,
      });

      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotalCustomers(data.totalCustomers || 0);
    } catch (err) {
      console.error("Customer fetch error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load customers. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open add form
  const openAddForm = () => {
    setEditingId(null);
    setFormData(initialForm);
    setFormError("");
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = (customer) => {
    setEditingId(customer._id);

    setFormData({
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      status: customer.status || "Active",
    });

    setFormError("");
    setShowForm(true);
  };

  // Close form
  const closeForm = () => {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setFormData(initialForm);
    setFormError("");
  };

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Add or update customer
  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanData = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      company: formData.company.trim() || "Individual",
      status: formData.status,
    };

    if (!cleanData.name || !cleanData.email || !cleanData.phone) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (cleanData.phone.replace(/\D/g, "").length < 10) {
      setFormError(
        "Enter a valid phone number with at least 10 digits."
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");
      setSuccess("");

      if (editingId) {
        await updateCustomer(editingId, cleanData);
      } else {
        await createCustomer(cleanData);
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(initialForm);
      setSelectedIds([]);

      // Fetch the latest customer list
      const data = await getCustomers({
        search: editingId ? search : "",
        status: editingId ? status : "",
        page: 1,
        limit: 5,
      });

      setCustomers(data.customers || []);
      setTotalPages(data.totalPages || 1);
      setTotalCustomers(data.totalCustomers || 0);

      setSearch("");
      setStatus("");
      setPage(1);

      setSuccess(
        editingId
          ? "Customer updated successfully."
          : "Customer added successfully."
      );

      setError("");
    } catch (err) {
      console.error("Customer save error:", err);

      setFormError(
        err.response?.data?.message ||
          "Unable to save customer. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete individual customer
  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await deleteCustomer(customer._id);

      setSelectedIds((previous) =>
        previous.filter((id) => id !== customer._id)
      );

      setSuccess("Customer deleted successfully.");

      if (customers.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchCustomers();
      }
    } catch (err) {
      console.error("Customer delete error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete customer."
      );
    }
  };

  // Bulk delete selected customers
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedIds.length} selected customers?`
    );

    if (!confirmed) return;

    const allCurrentPageCustomersSelected =
      customers.length > 0 &&
      customers.every((customer) =>
        selectedIds.includes(customer._id)
      );

    try {
      setBulkDeleting(true);
      setError("");
      setSuccess("");

      const result = await bulkDeleteCustomers(selectedIds);

      setSuccess(
        result.message || "Selected customers deleted successfully."
      );

      setSelectedIds([]);

      if (allCurrentPageCustomersSelected && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchCustomers();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Bulk deletion failed."
      );
    } finally {
      setBulkDeleting(false);
    }
  };

  // Select or deselect all customers on the current page
  const handleSelectAll = (checked) => {
    const currentPageIds = customers.map(
      (customer) => customer._id
    );

    setSelectedIds((previous) =>
      checked
        ? [...new Set([...previous, ...currentPageIds])]
        : previous.filter(
            (id) => !currentPageIds.includes(id)
          )
    );
  };

  // Reusable DataGrid column definitions
  
const columns = useMemo(
  () => [
    ...(isAdmin
      ? [
          {
            id: "select",
            header: () => (
              <input
                type="checkbox"
                aria-label="Select all customers on this page"
                checked={
                  customers.length > 0 &&
                  customers.every((customer) =>
                    selectedIds.includes(customer._id)
                  )
                }
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            ),
            enableSorting: false,
            cell: ({ row }) => {
              const customer = row.original;
              const isSelected = selectedIds.includes(customer._id);

              return (
                <input
                  type="checkbox"
                  aria-label={`Select ${customer.name}`}
                  checked={isSelected}
                  onChange={(e) => {
                    setSelectedIds((previous) =>
                      e.target.checked
                        ? [...new Set([...previous, customer._id])]
                        : previous.filter((id) => id !== customer._id)
                    );
                  }}
                  style={{
                    opacity:
                      hoveredCustomerId === customer._id || isSelected
                        ? 1
                        : 0,
                    cursor: "pointer",
                    transition: "opacity 0.2s ease",
                    width: "16px",
                    height: "16px",
                  }}
                />
              );
            },
          },
        ]
      : []),

    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => <strong>{row.original.name}</strong>,
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "company",
      header: "Company",
      cell: ({ row }) => row.original.company || "Individual",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const customer = row.original;
        const isActive = customer.status === "Active";

        return (
          <span
            style={{
              ...styles.statusBadge,
              background: isActive ? "#dcfce7" : "#fee2e2",
              color: isActive ? "#15803d" : "#b91c1c",
            }}
          >
            {customer.status}
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
              const customer = row.original;

              return (
                <div style={styles.actionButtons}>
                  <button
                    type="button"
                    onClick={() => openEditForm(customer)}
                    title="Edit customer"
                    style={styles.editButton}
                  >
                    <Edit size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(customer)}
                    title="Delete customer"
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            },
          },
        ]
      : []),
  ],
  [isAdmin, customers, selectedIds, hoveredCustomerId]
);

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Customers</h1>

          <p style={styles.subtitle}>
            Manage and monitor your customers.
          </p>

          <p style={styles.count}>
            {totalCustomers} total customers
          </p>
          {!isAdmin && (
  <p style={{ color: "#64748b", fontSize: "13px", marginTop: "8px" }}>
    <strong>Viewer Mode:</strong> You have read-only access.
  </p>
)}
        </div>

        <div style={styles.headerActions}>
          {isAdmin && (
  <button
    type="button"
    onClick={openAddForm}
    style={styles.primaryButton}
  >
    <Plus size={17} />
    Add Customer
  </button>
)}

          {isAdmin && selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              style={{
                ...styles.primaryButton,
                background: "#dc2626",
                opacity: bulkDeleting ? 0.7 : 1,
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

      {/* Success message */}
      {success && (
        <div style={styles.successMessage}>
          {success}

          <button
            type="button"
            onClick={() => setSuccess("")}
            style={styles.messageClose}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div style={styles.toolbar}>
        <div style={styles.searchBox}>
          <Search size={18} color="#64748b" />

          <input
            type="text"
            placeholder="Search by name, email or company..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIds([]);
              setPage(1);
            }}
            style={styles.searchInput}
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedIds([]);
                setPage(1);
              }}
              style={styles.clearSearch}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setSelectedIds([]);
            setPage(1);
          }}
          style={styles.select}
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button
          type="button"
          onClick={fetchCustomers}
          title="Refresh customers"
          style={styles.refreshButton}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div style={styles.errorMessage}>
          {error}

          <button
            type="button"
            onClick={() => setError("")}
            style={styles.messageClose}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Reusable Data Grid */}
      <div style={styles.tableContainer}>
        <DataGrid
          columns={columns}
          data={customers}
          selectedRows={selectedCustomers}
          exportFileName="customers"
          loading={loading}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          showSearch={false}
          emptyMessage="No customers found. Try changing your search or filters."
          onRowMouseEnter={(customer) =>
            setHoveredCustomerId(customer._id)
          }
          onRowMouseLeave={() =>
            setHoveredCustomerId(null)
          }
        />

        <div style={styles.tableFooter}>
          Showing {customers.length} of {totalCustomers} customers
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {showForm && isAdmin && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={styles.modalTitle}>
                  {editingId ? "Edit Customer" : "Add New Customer"}
                </h2>

                <p style={styles.modalSubtitle}>
                  {editingId
                    ? "Update customer information."
                    : "Enter the customer information below."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                style={styles.closeButton}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {[
                {
                  name: "name",
                  label: "Full Name",
                  type: "text",
                  placeholder: "Enter full name",
                },
                {
                  name: "email",
                  label: "Email Address",
                  type: "email",
                  placeholder: "Enter email address",
                },
                {
                  name: "phone",
                  label: "Phone Number",
                  type: "tel",
                  placeholder: "Enter phone number",
                },
                {
                  name: "company",
                  label: "Company",
                  type: "text",
                  placeholder: "Enter company name",
                },
              ].map((field) => (
                <div key={field.name} style={styles.formGroup}>
                  <label style={styles.label}>
                    {field.label}

                    {field.name !== "company" && (
                      <span style={{ color: "#dc2626" }}> *</span>
                    )}
                  </label>

                  <input
                    type={field.type}
                    name={field.name}
                    value={formData[field.name]}
                    onChange={handleInputChange}
                    placeholder={field.placeholder}
                    required={field.name !== "company"}
                    maxLength={
                      field.name === "phone" ? 20 : 100
                    }
                    style={styles.formInput}
                  />
                </div>
              ))}

              <div style={styles.formGroup}>
                <label style={styles.label}>Status</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  style={styles.formInput}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {formError && (
                <div style={styles.formError}>
                  {formError}
                </div>
              )}

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  style={styles.primaryButton}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Customer"
                      : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Component styles
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "15px",
    marginBottom: "24px",
  },

  headerActions: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },

  heading: {
    margin: "0 0 5px",
    fontSize: "30px",
    color: "#172033",
  },

  subtitle: {
    margin: 0,
    color: "#64748b",
  },

  count: {
    fontSize: "13px",
    color: "#64748b",
    marginTop: "8px",
  },

  primaryButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    background: "#4f46e5",
    color: "white",
    border: "none",
    borderRadius: "8px",
    padding: "12px 17px",
    cursor: "pointer",
    fontWeight: 600,
  },

  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap",
  },

  searchBox: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    flex: 1,
    minWidth: "200px",
    border: "1px solid #dce1e9",
    borderRadius: "9px",
    padding: "11px 13px",
    background: "white",
  },

  searchInput: {
    border: "none",
    outline: "none",
    width: "100%",
    fontSize: "14px",
    background: "transparent",
  },

  clearSearch: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    color: "#64748b",
  },

  select: {
    padding: "11px",
    borderRadius: "8px",
    border: "1px solid #dce1e9",
    background: "white",
  },

  refreshButton: {
    padding: "10px 12px",
    border: "1px solid #dce1e9",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
  },

  tableContainer: {
    background: "white",
    borderRadius: "13px",
    padding: "20px",
    overflowX: "auto",
  },

  tableFooter: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "18px",
    color: "#64748b",
    fontSize: "13px",
  },

  statusBadge: {
    padding: "5px 11px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: 600,
  },

  actionButtons: {
    display: "flex",
    gap: "9px",
  },

  editButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    border: "none",
    borderRadius: "7px",
    background: "#eef2ff",
    color: "#4f46e5",
    cursor: "pointer",
  },

  deleteButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    border: "none",
    borderRadius: "7px",
    background: "#fee2e2",
    color: "#dc2626",
    cursor: "pointer",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15, 23, 42, 0.60)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    padding: "18px",
  },

  modal: {
    background: "white",
    padding: "26px",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "470px",
    maxHeight: "90vh",
    overflowY: "auto",
    boxSizing: "border-box",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "23px",
  },

  modalTitle: {
    margin: 0,
    color: "#172033",
    fontSize: "21px",
  },

  modalSubtitle: {
    margin: "6px 0 0",
    fontSize: "13px",
    color: "#64748b",
  },

  closeButton: {
    border: "none",
    background: "#f1f5f9",
    borderRadius: "7px",
    padding: "7px",
    cursor: "pointer",
  },

  formGroup: {
    marginBottom: "16px",
  },

  label: {
    display: "block",
    marginBottom: "7px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#334155",
  },

  formInput: {
    width: "100%",
    padding: "11px",
    border: "1px solid #dce1e9",
    borderRadius: "7px",
    boxSizing: "border-box",
    outlineColor: "#4f46e5",
    background: "white",
  },

  formError: {
    padding: "10px",
    marginBottom: "15px",
    borderRadius: "7px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "13px",
  },

  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "22px",
  },

  cancelButton: {
    padding: "11px 17px",
    border: "1px solid #dce1e9",
    borderRadius: "8px",
    background: "white",
    cursor: "pointer",
  },

  successMessage: {
    padding: "12px 15px",
    marginBottom: "15px",
    background: "#dcfce7",
    color: "#15803d",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
  },

  errorMessage: {
    padding: "12px 15px",
    marginBottom: "15px",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
    display: "flex",
    justifyContent: "space-between",
  },

  messageClose: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "inherit",
  },
};

export default Customers;
