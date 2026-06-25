import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import "./index.css";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CartPage from "./pages/CartPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import OrderPage from "./pages/OrderPage";
import AdminPage from "./pages/AdminPage";

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner" />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/" />;
  return children;
}

function StudentLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { count } = useCart();
  const path = location.pathname;

  return (
    <div className="app-shell">
      {/* Top bar */}
      <div className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">🌙</div>
          <div>
            <div className="topbar-name">Chandradip</div>
            <div className="topbar-sub">Next-day hostel delivery</div>
          </div>
        </div>
        <div className="topbar-actions">
          <div className="topbar-icon" style={{ position: "relative" }} onClick={() => navigate("/cart")}>
            🛒
            {count > 0 && <span className="cart-badge">{count}</span>}
          </div>
          <div className="topbar-icon" onClick={logout} title="Sign out">⏻</div>
        </div>
      </div>

      {children}

      {/* Bottom nav */}
      <div className="bottom-nav">
        <div className={`nav-item ${path === "/" ? "active" : ""}`} onClick={() => navigate("/")}>
          <span style={{ fontSize: 22 }}>🏠</span>
          <span>Home</span>
        </div>
        <div className={`nav-item ${path === "/cart" ? "active" : ""}`} onClick={() => navigate("/cart")}>
          <span style={{ fontSize: 22 }}>🛒</span>
          <span>Cart {count > 0 ? `(${count})` : ""}</span>
        </div>
        <div className={`nav-item ${path.startsWith("/orders") ? "active" : ""}`} onClick={() => navigate("/orders")}>
          <span style={{ fontSize: 22 }}>📋</span>
          <span>Orders</span>
        </div>
        <div className="nav-item" onClick={logout}>
          <span style={{ fontSize: 22 }}>👤</span>
          <span>Sign out</span>
        </div>
      </div>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/"} /> : <LoginPage />} />
      <Route path="/admin/*" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute><StudentLayout><HomePage /></StudentLayout></ProtectedRoute>} />
      <Route path="/cart" element={<ProtectedRoute><StudentLayout><CartPage /></StudentLayout></ProtectedRoute>} />
      <Route path="/orders" element={<ProtectedRoute><StudentLayout><MyOrdersPage /></StudentLayout></ProtectedRoute>} />
      <Route path="/orders/:id" element={<ProtectedRoute><StudentLayout><OrderPage /></StudentLayout></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Inter, sans-serif", fontSize: 13 } }} />
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
