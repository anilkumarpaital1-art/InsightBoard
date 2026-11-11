
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
  User,
  LayoutDashboard,
  ShieldCheck,
  TrendingUp,
  Users,
  ShoppingCart,
  BarChart3,
  ArrowUpRight,
  CircleDollarSign,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

import "../styles/Login.css";

function Login() {
  const { login, register, googleLogin, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(
    () => localStorage.getItem("insightboard_email") || ""
  );
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    () => Boolean(localStorage.getItem("insightboard_email"))
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);

        if (rememberMe) {
          localStorage.setItem("insightboard_email", email);
        } else {
          localStorage.removeItem("insightboard_email");
        }
      }

      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);

    try {
      if (!credentialResponse.credential) {
        throw new Error("Google authentication failed.");
      }

      await googleLogin(credentialResponse.credential);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister((previous) => !previous);
    setError("");
    setPassword("");
    setShowPassword(false);
  };

  return (
    <main className="login-page">
      <div className="login-card">

        {/* LEFT: AUTHENTICATION SECTION */}
        <section className="login-left">

          <div className="login-mobile-brand">
            <div className="login-logo">I</div>
            <span>InsightBoard</span>
          </div>

          <div className="login-form-wrapper">

            <div className="login-heading">
              <span className="login-eyebrow">
                WELCOME TO INSIGHTBOARD
              </span>

              <h1>
                {isRegister ? "Create your account" : "Welcome back"}
              </h1>

              <p>
                {isRegister
                  ? "Join InsightBoard and make smarter business decisions."
                  : "Enter your details to access your business dashboard."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">

              {/* FULL NAME - REGISTRATION ONLY */}
              {isRegister && (
                <div className="login-field">
                  <label htmlFor="name">Full name</label>

                  <div className="login-input">
                    <User size={18} />

                    <input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoComplete="name"
                      maxLength={80}
                      required
                    />
                  </div>
                </div>
              )}

              {/* EMAIL */}
              <div className="login-field">
                <label htmlFor="email">Email address</label>

                <div className="login-input">
                  <Mail size={18} />

                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="login-field">
                <label htmlFor="password">Password</label>

                <div className="login-input">
                  <LockKeyhole size={18} />

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      isRegister
                        ? "Create a password (min. 8 characters)"
                        : "Enter your password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    minLength={isRegister ? 8 : undefined}
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword
                      ? <EyeOff size={19} />
                      : <Eye size={19} />}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME */}
              {!isRegister && (
                <div className="login-options">
                  <label className="remember-option">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                </div>
              )}

              {/* ERROR */}
              {error && (
                <div className="login-error" role="alert">
                  {error}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" />
                    {isRegister ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  isRegister ? "Create Account" : "Sign In"
                )}
              </button>

            </form>

            {/* DIVIDER */}
            <div className="login-divider">
              <span />
              <p>OR CONTINUE WITH</p>
              <span />
            </div>

            {/* GOOGLE SIGN-IN */}
            <div className="google-login-wrapper">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError("Google sign-in was unsuccessful.")}
                theme="outline"
                shape="pill"
                size="large"
                text="continue_with"
                width="350"
              />
            </div>

            {/* MODE SWITCH */}
            <div className="login-mode-switch">
              <span>
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </span>

              <button type="button" onClick={switchMode}>
                {isRegister ? "Sign In" : "Create Account"}
              </button>
            </div>

            <div className="login-security">
              <ShieldCheck size={16} />
              <span>Secure access to your business dashboard</span>
            </div>

          </div>

          <div className="login-copyright">
            © 2026 InsightBoard. All rights reserved.
          </div>

        </section>

        {/* RIGHT: BRANDING AND DASHBOARD PREVIEW */}
        <section className="login-right">

          <div className="promo-brand">
            <div className="promo-logo">
              <LayoutDashboard size={19} />
            </div>
            <span>InsightBoard</span>
          </div>

          <div className="promo-content">
            <span className="promo-tag">
              <TrendingUp size={15} />
              SMARTER BUSINESS INSIGHTS
            </span>

            <h2>
              Turn your data into
              <br />
              smarter decisions.
            </h2>

            <p>
              Monitor performance, analyze business trends,
              and manage your customers through one powerful
              analytics dashboard.
            </p>
          </div>

          {/* DASHBOARD PREVIEW */}
          <div className="preview-dashboard">

            <div className="preview-topbar">
              <div className="preview-brand">
                <div className="preview-mini-logo">I</div>
                <strong>InsightBoard</strong>
              </div>

              <div className="preview-user">
                <span>Admin Dashboard</span>
                <div className="preview-avatar">A</div>
              </div>
            </div>

            <div className="preview-body">

              <aside className="preview-sidebar">
                <span className="preview-menu-label">MENU</span>

                <div className="preview-menu-item active">
                  <LayoutDashboard size={13} />
                  Dashboard
                </div>

                <div className="preview-menu-item">
                  <Users size={13} />
                  Customers
                </div>

                <div className="preview-menu-item">
                  <ShoppingCart size={13} />
                  Products
                </div>

                <div className="preview-menu-item">
                  <BarChart3 size={13} />
                  Analytics
                </div>
              </aside>

              <div className="preview-main">

                <div className="preview-heading">
                  <div>
                    <strong>Overview</strong>
                    <small>Your business at a glance</small>
                  </div>
                  <span className="preview-period">Last 30 days</span>
                </div>

                <div className="preview-stats">

                  <div className="preview-stat">
                    <span>Total Revenue</span>
                    <CircleDollarSign size={15} />
                    <strong>$48,290</strong>
                    <small>↗ 12.8%</small>
                  </div>

                  <div className="preview-stat">
                    <span>Customers</span>
                    <Users size={15} />
                    <strong>2,450</strong>
                    <small>↗ 8.4%</small>
                  </div>

                  <div className="preview-stat">
                    <span>Total Orders</span>
                    <ShoppingCart size={15} />
                    <strong>1,284</strong>
                    <small>↗ 15.2%</small>
                  </div>

                </div>

                <div className="preview-chart-card">
                  <div className="preview-chart-heading">
                    <strong>Revenue Overview</strong>
                    <span>Monthly performance</span>
                  </div>

                  <div className="preview-chart">
                    <div className="chart-y-labels">
                      <span>50k</span>
                      <span>40k</span>
                      <span>30k</span>
                      <span>20k</span>
                      <span>10k</span>
                    </div>

                    <div className="chart-bars">
                      {[38, 55, 45, 76, 59, 87, 66, 95, 73, 84, 68, 100].map(
                        (height, index) => (
                          <div className="chart-bar-group" key={index}>
                            <div
                              className="chart-bar"
                              style={{ height: `${height}%` }}
                            />
                            <div
                              className="chart-bar-secondary"
                              style={{ height: `${height * 0.42}%` }}
                            />
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="chart-months">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
                      (month) => (
                        <span key={month}>{month}</span>
                      )
                    )}
                  </div>
                </div>

                <div className="preview-bottom">
                  <div>
                    <span>Business Growth</span>
                    <strong>+24.6%</strong>
                    <small>Compared to last year</small>
                  </div>

                  <div className="preview-growth-icon">
                    <ArrowUpRight size={25} />
                  </div>
                </div>

              </div>
            </div>
          </div>

          <div className="promo-footer">
            <span>INSIGHTS THAT DRIVE GROWTH</span>
            <span>POWERED BY INSIGHTBOARD</span>
          </div>

        </section>
      </div>
    </main>
  );
}

export default Login;