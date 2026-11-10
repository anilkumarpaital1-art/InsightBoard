
import { useState } from "react";
import * as XLSX from "xlsx";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

function DataGrid({
  columns = [],
  data = [],
  loading = false,
  error = "",
  page = 1,
  totalPages = 1,
  onPageChange,
  onSearch,
  searchPlaceholder = "Search...",
  emptyMessage = "No records found",
  showSearch = true,
  onRowMouseEnter,
  onRowMouseLeave,
  selectedRows = [],
  exportFileName = "data",
}) {
  const [sorting, setSorting] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    enableMultiSort: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const handleSearch = (value) => {
    setGlobalFilter(value);
    onSearch?.(value);
  };

  // Get columns that should appear in exported files
  const getExportColumns = () => {
    return table.getAllLeafColumns().filter((column) => {
      return (
        column.id !== "select" &&
        column.id !== "actions" &&
        column.getIsVisible() &&
        (column.accessorFn || column.accessorKey)
      );
    });
  };

  // Get readable column headings
  const getExportHeader = (column) => {
    const header = column.columnDef.header;

    return typeof header === "string"
      ? header
      : column.id;
  };

  // Get original data instead of formatted React cell content
  const getExportValue = (record, column, index) => {
    if (column.accessorFn) {
      return column.accessorFn(record, index);
    }

    if (column.accessorKey) {
      return column.accessorKey
        .split(".")
        .reduce(
          (value, key) => value?.[key],
          record
        ) ?? "";
    }

    return "";
  };

  // Prepare data for export
  const prepareExportData = (records) => {
    const exportColumns = getExportColumns();

    const headers = exportColumns.map(getExportHeader);

    const rows = records.map((record, index) =>
      exportColumns.map((column) =>
        getExportValue(record, column, index)
      )
    );

    return [headers, ...rows];
  };

  // Export CSV
  const exportCSV = (records, suffix = "") => {
    if (!records.length) return;

    const worksheet = XLSX.utils.aoa_to_sheet(
      prepareExportData(records)
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Data"
    );

    XLSX.writeFile(
      workbook,
      `${exportFileName}${suffix}.csv`,
      { bookType: "csv" }
    );
  };

  // Export Excel
  const exportExcel = (records, suffix = "") => {
    if (!records.length) return;

    const worksheet = XLSX.utils.aoa_to_sheet(
      prepareExportData(records)
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Data"
    );

    XLSX.writeFile(
      workbook,
      `${exportFileName}${suffix}.xlsx`,
      { bookType: "xlsx" }
    );
  };

  // Export currently filtered and sorted rows
  const handleExportAllCSV = () => {
    const records = table
      .getFilteredRowModel()
      .rows
      .map((row) => row.original);

    exportCSV(records);
  };

  const handleExportAllExcel = () => {
    const records = table
      .getFilteredRowModel()
      .rows
      .map((row) => row.original);

    exportExcel(records);
  };

  // Export selected rows
  const handleExportSelectedCSV = () => {
    exportCSV(selectedRows, "-selected");
  };

  const handleExportSelectedExcel = () => {
    exportExcel(selectedRows, "-selected");
  };

  const exportButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "7px",
    padding: "10px 13px",
    border: "1px solid #dce1e9",
    borderRadius: "8px",
    background: "#fff",
    color: "#334155",
    fontSize: "13px",
    fontWeight: 600,
    cursor: "pointer",
  };

  const hasRows = data.length > 0;

  return (
    <div style={styles.wrapper}>

      {/* Search and Export Toolbar */}
      <div style={styles.toolbar}>

        {showSearch && (
          <input
            type="text"
            value={globalFilter}
            onChange={(e) =>
              handleSearch(e.target.value)
            }
            placeholder={searchPlaceholder}
            style={styles.searchInput}
          />
        )}

        <div style={styles.exportButtons}>

          <button
            type="button"
            onClick={handleExportAllCSV}
            disabled={loading || !hasRows}
            style={{
              ...exportButtonStyle,
              opacity: loading || !hasRows ? 0.5 : 1,
            }}
          >
            <FileText size={16} />
            Export CSV
          </button>

          <button
            type="button"
            onClick={handleExportAllExcel}
            disabled={loading || !hasRows}
            style={{
              ...exportButtonStyle,
              opacity: loading || !hasRows ? 0.5 : 1,
            }}
          >
            <FileSpreadsheet size={16} />
            Export Excel
          </button>

          {selectedRows.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportSelectedCSV}
                disabled={loading}
                style={exportButtonStyle}
              >
                <Download size={15} />
                Selected CSV ({selectedRows.length})
              </button>

              <button
                type="button"
                onClick={handleExportSelectedExcel}
                disabled={loading}
                style={exportButtonStyle}
              >
                <Download size={15} />
                Selected Excel ({selectedRows.length})
              </button>
            </>
          )}

        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>

          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                      style={{
                        ...styles.th,
                        cursor: header.column.getCanSort()
                          ? "pointer"
                          : "default",
                      }}
                    >
                      <div style={styles.headerContent}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}

                        {header.column.getCanSort() && (
                          <span style={styles.sortIcon}>
                            {sorted === "asc" ? (
                              <ChevronUp size={15} />
                            ) : sorted === "desc" ? (
                              <ChevronDown size={15} />
                            ) : (
                              <ChevronsUpDown
                                size={14}
                                color="#94a3b8"
                              />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  style={styles.messageCell}
                >
                  Loading data...
                </td>
              </tr>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  onMouseEnter={() =>
                    onRowMouseEnter?.(row.original)
                  }
                  onMouseLeave={() =>
                    onRowMouseLeave?.(row.original)
                  }
                  style={styles.row}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} style={styles.td}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={Math.max(columns.length, 1)}
                  style={styles.messageCell}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Pagination */}
      {onPageChange && (
        <div style={styles.pagination}>

          <span>
            Page {page} of {Math.max(totalPages, 1)}
          </span>

          <div style={styles.paginationButtons}>
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1 || loading}
              style={{
                ...styles.pageButton,
                opacity: page <= 1 || loading ? 0.45 : 1,
                cursor:
                  page <= 1 || loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Previous
            </button>

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages || loading}
              style={{
                ...styles.pageButton,
                opacity:
                  page >= totalPages || loading ? 0.45 : 1,
                cursor:
                  page >= totalPages || loading
                    ? "not-allowed"
                    : "pointer",
              }}
            >
              Next
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
  },

  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },

  exportButtons: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "wrap",
  },

  searchInput: {
    width: "100%",
    maxWidth: "350px",
    padding: "11px 14px",
    border: "1px solid #dce1e9",
    borderRadius: "8px",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  error: {
    padding: "12px",
    marginBottom: "12px",
    background: "#fee2e2",
    color: "#b91c1c",
    borderRadius: "8px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
  },

  table: {
    width: "100%",
    minWidth: "850px",
    borderCollapse: "collapse",
    textAlign: "left",
  },

  th: {
    padding: "15px 12px",
    borderBottom: "1px solid #e8ebf0",
    color: "#475569",
    fontSize: "14px",
    fontWeight: 600,
    whiteSpace: "nowrap",
    background: "#fff",
  },

  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    whiteSpace: "nowrap",
  },

  sortIcon: {
    display: "inline-flex",
    alignItems: "center",
  },

  row: {
    background: "#fff",
    transition: "background 0.2s ease",
  },

  td: {
    padding: "16px 12px",
    borderBottom: "1px solid #edf0f4",
    color: "#334155",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },

  messageCell: {
    textAlign: "center",
    padding: "35px 15px",
    color: "#64748b",
    fontSize: "14px",
  },

  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
    marginTop: "20px",
    flexWrap: "wrap",
    color: "#64748b",
    fontSize: "13px",
  },

  paginationButtons: {
    display: "flex",
    gap: "8px",
  },

  pageButton: {
    padding: "9px 14px",
    border: "1px solid #dce1e9",
    borderRadius: "7px",
    background: "#fff",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 500,
  },
};

export default DataGrid;
