import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getDashboardStats } from "./services/dashboardService";
import Login from "./pages/Login";
import { useAuth } from "./context/AuthContext";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Products from "./pages/Products";

import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  ChartNoAxesCombined,
  Settings,
  HelpCircle,
  Search,
  Bell,
  DollarSign,
  Package,
  TrendingUp,
  ArrowUpRight,
  MoreHorizontal,
  LogOut
} from "lucide-react";

import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";

import "./App.css";

const revenueData = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 18000 },
  { month: "Mar", revenue: 15000 },
  { month: "Apr", revenue: 24000 },
  { month: "May", revenue: 21000 },
  { month: "Jun", revenue: 29000 },
  { month: "Jul", revenue: 26000 },
  { month: "Aug", revenue: 34000 },
  { month: "Sep", revenue: 31000 },
  { month: "Oct", revenue: 42000 },
  { month: "Nov", revenue: 38000 },
  { month: "Dec", revenue: 48000 }
];

const ordersData = [
  { month: "Jan", orders: 120 },
  { month: "Feb", orders: 180 },
  { month: "Mar", orders: 150 },
  { month: "Apr", orders: 220 },
  { month: "May", orders: 190 },
  { month: "Jun", orders: 280 },
  { month: "Jul", orders: 250 },
  { month: "Aug", orders: 320 },
  { month: "Sep", orders: 290 },
  { month: "Oct", orders: 380 },
  { month: "Nov", orders: 350 },
  { month: "Dec", orders: 450 }
];

const orderStatusData = [
  { name: "Completed", value: 65 },
  { name: "Pending", value: 20 },
  { name: "Cancelled", value: 15 }
];

const statusColors = ["#16a34a", "#f59e0b", "#ef4444"];

const performanceData = [
  { month: "Jan", revenue: 12000, expenses: 7000 },
  { month: "Feb", revenue: 18000, expenses: 9000 },
  { month: "Mar", revenue: 15000, expenses: 8500 },
  { month: "Apr", revenue: 24000, expenses: 12000 },
  { month: "May", revenue: 21000, expenses: 11000 },
  { month: "Jun", revenue: 29000, expenses: 15000 },
  { month: "Jul", revenue: 26000, expenses: 13000 },
  { month: "Aug", revenue: 34000, expenses: 17000 },
  { month: "Sep", revenue: 31000, expenses: 16000 },
  { month: "Oct", revenue: 42000, expenses: 21000 },
  { month: "Nov", revenue: 38000, expenses: 19000 },
  { month: "Dec", revenue: 48000, expenses: 24000 }
];

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}


function DashboardHome() {

const [dashboard, setDashboard] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [selectedRange, setSelectedRange] = useState("12m");

// Custom date states
const [customStartDate, setCustomStartDate] = useState("");
const [customEndDate, setCustomEndDate] = useState("");
const [appliedCustomRange, setAppliedCustomRange] = useState(null);

const loadDashboard = async (
  range = selectedRange,
  customDates = appliedCustomRange
) => {
  try {
    if (range === "custom" && !customDates) {
      return;
    }

    setLoading(true);
    setError("");

    const data =
      range === "custom"
        ? await getDashboardStats(
            "custom",
            customDates.startDate,
            customDates.endDate
          )
        : await getDashboardStats(range);

    setDashboard(data);
  } catch (err) {
    setError(
      err.response?.data?.message ||
      err.message ||
      "Unable to load dashboard data."
    );
  } finally {
    setLoading(false);
  }
};

// Automatically load preset ranges.
// Custom ranges will load only when Apply is clicked.
useEffect(() => {
  if (selectedRange !== "custom") {
    loadDashboard(selectedRange);
  } else if (appliedCustomRange) {
    loadDashboard("custom", appliedCustomRange);
  }
}, [selectedRange, appliedCustomRange]);


  const stats = [
    {
      title: "Total Revenue",
      value: `$${(dashboard?.stats?.totalRevenue || 0).toLocaleString("en-US", {
        maximumFractionDigits: 2,
      })}`,
      icon: DollarSign,
      color: "blue",
    },
    {
      title: "Total Orders",
      value: (dashboard?.stats?.totalOrders || 0).toLocaleString(),
      icon: ShoppingCart,
      color: "purple",
    },
    {
      title: "Total Customers",
      value: (dashboard?.stats?.totalCustomers || 0).toLocaleString(),
      icon: Users,
      color: "green",
    },
    {
      title: "Total Products",
      value: (dashboard?.stats?.totalProducts || 0).toLocaleString(),
      icon: Package,
      color: "orange",
    },
  ];

  const statusColors = {
    Completed: "#16a34a",
    Pending: "#f59e0b",
    Processing: "#6366f1",
    Cancelled: "#ef4444",
  };

  const orderStatusData = dashboard?.orderStatusData || [];

const customDays =
  appliedCustomRange
    ? (
        new Date(`${appliedCustomRange.endDate}T00:00:00Z`) -
        new Date(`${appliedCustomRange.startDate}T00:00:00Z`)
      ) / (1000 * 60 * 60 * 24)
    : null;

const isDailyRange =
  selectedRange === "7d" ||
  selectedRange === "30d" ||
  (selectedRange === "custom" &&
    customDays !== null &&
    customDays < 31);

const chartPeriodLabel = isDailyRange ? "Daily" : "Monthly";

  return (
    <section className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Business Overview</h1>
          <p>Monitor your business performance at a glance.</p>
        </div>

        <div
  style={{
    display: "flex",
    gap: "10px",
    alignItems: "center",
    flexWrap: "wrap",
  }}
>
  <select
    className="date-btn"
    value={selectedRange}
    onChange={(e) => setSelectedRange(e.target.value)}
    disabled={loading}
  >
    <option value="7d">Last 7 Days</option>
    <option value="30d">Last 30 Days</option>
    <option value="3m">Last 3 Months</option>
    <option value="6m">Last 6 Months</option>
    <option value="12m">Last 12 Months</option>
    <option value="custom">Custom Date Range</option>
  </select>

  {selectedRange === "custom" && (
    <>
      <input
        type="date"
        className="date-btn"
        value={customStartDate}
        max={customEndDate || undefined}
        onChange={(e) => setCustomStartDate(e.target.value)}
        disabled={loading}
      />

      <input
        type="date"
        className="date-btn"
        value={customEndDate}
        min={customStartDate || undefined}
        onChange={(e) => setCustomEndDate(e.target.value)}
        disabled={loading}
      />

      <button
        className="date-btn"
        onClick={() => {
          if (!customStartDate || !customEndDate) {
            setError("Please select both start date and end date.");
            return;
          }

          setError("");

          setAppliedCustomRange({
            startDate: customStartDate,
            endDate: customEndDate,
          });
        }}
        disabled={loading || !customStartDate || !customEndDate}
      >
        Apply
      </button>
    </>
  )}

  <button
    className="date-btn"
    onClick={() => loadDashboard()}
    disabled={loading}
  >
    Refresh Data
  </button>
</div>
      </div>

      {loading && (
        <p style={{ padding: "20px 0", color: "#64748b" }}>
          Loading dashboard analytics...
        </p>
      )}

      {error && (
        <div style={{ padding: "15px", color: "#dc2626" }}>
          <p>{error}</p>
          <button onClick={loadDashboard}>Try Again</button>
        </div>
      )}

      {!loading && !error && dashboard && (
        <>
          <div className="stats-grid">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div className="stat-card" key={item.title}>
                  <div className="stat-top">
                    <div className={`stat-icon ${item.color}`}>
                      <Icon size={21} />
                    </div>
                    <button className="more-btn" type="button">
                      <MoreHorizontal size={21} />
                    </button>
                  </div>

                  <p className="stat-title">{item.title}</p>

                  <div className="stat-bottom">
                    <h2>{item.value}</h2>
                  </div>

                  <p className="stat-note">
                    <ArrowUpRight size={13} />
                    Live database data
                  </p>
                </div>
              );
            })}
          </div>

          <div className="charts-grid">
            <div className="chart-card large-chart">
              <div className="chart-header">
                <div>
                  <h3>Revenue Analytics</h3>
                  <p>{chartPeriodLabel} revenue from completed orders</p>
                </div>
<span className="chart-tag">
  {selectedRange === "7d"
    ? "Last 7 Days"
    : selectedRange === "30d"
    ? "Last 30 Days"
    : selectedRange === "3m"
    ? "Last 3 Months"
    : selectedRange === "6m"
    ? "Last 6 Months"
    : selectedRange === "custom" && appliedCustomRange
    ? `${appliedCustomRange.startDate} to ${appliedCustomRange.endDate}`
    : "Last 12 Months"}
</span>
              </div>

              <ResponsiveContainer width="100%" height={175}>
                <LineChart data={dashboard.revenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf0f5"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) =>
                      `$${Number(value).toLocaleString("en-US")}`
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>{chartPeriodLabel} Orders</h3>
                  <p>Number of orders received</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={175}>
                <BarChart data={dashboard.ordersData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf0f5"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="orders"
                    fill="#6366f1"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <div>
                  <h3>Order Status</h3>
                  <p>Distribution of all orders</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={175}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    dataKey="value"
                    nameKey="name"
                    cx="40%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={4}
                  >
                    {orderStatusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={statusColors[entry.name] || "#94a3b8"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                    wrapperStyle={{ fontSize: "11px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card large-chart">
              <div className="chart-header">
                <div>
                  <h3>Revenue Overview</h3>
                  <p>{chartPeriodLabel} completed-order revenue</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={175}>
                <AreaChart data={dashboard.revenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#edf0f5"
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) =>
                      `$${Number(value).toLocaleString("en-US")}`
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4f46e5"
                    fill="#818cf8"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </section>
  );
}


function DashboardLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">I</div>
          <h2>InsightBoard</h2>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav className="sidebar-menu">
          <NavLink to="/" end className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink to="/customers" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
            <Users size={19} />
            <span>Customers</span>
          </NavLink>

          <NavLink to="/orders" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
            <ShoppingCart size={19} />
            <span>Orders</span>
          </NavLink>

          <NavLink to="/products" className={({ isActive }) => `menu-item ${isActive ? "active" : ""}`}>
            <Package size={19} />
            <span>Products</span>
          </NavLink>

          <a className="menu-item">
            <ChartNoAxesCombined size={19} />
            <span>Analytics</span>
          </a>
        </nav>

        <div className="sidebar-bottom">
          <a className="menu-item">
            <HelpCircle size={19} />
            <span>Help & Support</span>
          </a>

          <a className="menu-item">
            <Settings size={19} />
            <span>Settings</span>
          </a>

          <div className="profile">
            <div className="avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div>
              <h4>{user?.name || "Admin User"}</h4>
              <p>{user?.role || "Administrator"}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Logout"
              className="logout-btn"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>Dashboard</h2>
            <p>Welcome back! Here's what's happening today.</p>
          </div>

          <div className="header-actions">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="Search anything..." />
            </div>

            <button className="notification-btn">
              <Bell size={20} />
              <span></span>
            </button>

            <div className="header-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || "A"}
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/products" element={<Products />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
