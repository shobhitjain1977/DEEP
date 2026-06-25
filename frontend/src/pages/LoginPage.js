import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, adminLogin, register } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("login"); // login | register | admin
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", roomNumber: "", hostelBlock: "" });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name}!`);
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success("Registration sent! Wait for admin approval.");
      setTab("login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed");
    } finally { setLoading(false); }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminLogin(form.email, form.password);
      toast.success("Welcome, Rishi!");
      navigate("/admin");
    } catch (err) {
      toast.error(err.response?.data?.error || "Admin login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-logo-circle">🌙</div>
        <div className="auth-title">Chandradip</div>
        <div className="auth-sub">Hostel essentials, delivered next day</div>
      </div>

      <div className="auth-body">
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["login", "register", "admin"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: "9px 0", border: "none", cursor: "pointer",
                borderRadius: 8, fontSize: 13, fontWeight: 600,
                background: tab === t ? "var(--cd-purple)" : "var(--cd-surface)",
                color: tab === t ? "#fff" : "var(--cd-text-light)",
              }}
            >
              {t === "login" ? "Sign in" : t === "register" ? "Register" : "Admin"}
            </button>
          ))}
        </div>

        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">College email</label>
              <input className="form-input" type="email" placeholder="you@college.edu.in" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
            </div>
            <div className="auth-notice">
              🔒 Only approved students can log in. New here? Register and wait for admin approval.
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" placeholder="Your full name" value={form.name} onChange={set("name")} required />
            </div>
            <div className="form-group">
              <label className="form-label">College email</label>
              <input className="form-input" type="email" placeholder="you@college.edu.in" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Room number</label>
              <input className="form-input" placeholder="e.g. 204" value={form.roomNumber} onChange={set("roomNumber")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Hostel block (optional)</label>
              <input className="form-input" placeholder="e.g. Block A" value={form.hostelBlock} onChange={set("hostelBlock")} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Create a password" value={form.password} onChange={set("password")} required />
            </div>
            <div className="auth-notice">
              🛡️ Your account needs admin approval before you can place orders. You'll be notified once active.
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Request access"}
            </button>
          </form>
        )}

        {tab === "admin" && (
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label className="form-label">Admin email</label>
              <input className="form-input" type="email" placeholder="rishi@chandradip.com" value={form.email} onChange={set("email")} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} required />
            </div>
            <div className="auth-notice">
              🔐 Admin portal. Only Rishi can access this.
            </div>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Admin sign in"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
