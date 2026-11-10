
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
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
  const stats = [
    {
      title: "Total Revenue",
      value: "$48,294",
      change: "+12.8%",
      icon: DollarSign,
      color: "blue"
    },
    {
      title: "Total Orders",
      value: "2,450",
      change: "+8.2%",
      icon: ShoppingCart,
      color: "purple"
    },
    {
      title: "Total Customers",
      value: "1,840",
      change: "+15.4%",
      icon: Users,
      color: "green"
    },
    {
      title: "Total Products",
      value: "384",
      change: "+4.6%",
      icon: Package,
      color: "orange"
    }
  ];

  return (
    <section className="dashboard-content">
      <div className="page-heading">
        <div>
          <h1>Business Overview</h1>
          <p>Monitor your business performance at a glance.</p>
        </div>
        <button className="date-btn">Last 30 Days</button>
      </div>

      <div className="stats-grid">
        {stats.map((item, index) => {
          const Icon = item.icon;

          return (
            <div className="stat-card" key={index}>
              <div className="stat-top">
                <div className={`stat-icon ${item.color}`}>
                  <Icon size={21} />
                </div>
                <button className="more-btn">
                  <MoreHorizontal size={21} />
                </button>
              </div>

              <p className="stat-title">{item.title}</p>

              <div className="stat-bottom">
                <h2>{item.value}</h2>
                <span className="growth">
                  <TrendingUp size={14} />
                  {item.change}
                </span>
              </div>

              <p className="stat-note">
                <ArrowUpRight size={13} />
                Compared to last month
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
              <p>Monthly revenue performance</p>
            </div>
            <span className="chart-tag">2026</span>
          </div>

          <ResponsiveContainer width="100%" height={175}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
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
              <h3>Monthly Orders</h3>
              <p>Number of orders received</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={175}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="orders" fill="#6366f1" radius={[5, 5, 0, 0]} />
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
                {orderStatusData.map((entry, index) => (
                  <Cell key={entry.name} fill={statusColors[index]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value}%`} />
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
              <h3>Revenue vs Expenses</h3>
              <p>Monthly financial performance</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={175}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Legend />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="1"
                stroke="#4f46e5"
                fill="#818cf8"
              />
              <Area
                type="monotone"
                dataKey="expenses"
                stackId="1"
                stroke="#0d9488"
                fill="#5eead4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
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
