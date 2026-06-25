import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { API } from "../context/AuthContext";
import toast from "react-hot-toast";

const TABS = ["Orders", "Products", "Charges", "Users"];

export default function AdminPage() {
  const { logout } = useAuth();
  const [tab, setTab] = useState("Orders");
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [stats, setStats] = useState({});
  const [charges, setCharges] = useState({ deliveryCharge: 20, handlingCharge: 10, taxPercent: 5, extraCharge: 0, extraChargeLabel: "" });
  const [newProduct, setNewProduct] = useState({ name: "", category: "food", price: "", unit: "", description: "" });
  const [editProduct, setEditProduct] = useState(null);

  const load = async () => {
    try {
      const [ord, prod, usr, pend, sts, chrg] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/products`),
        axios.get(`${API}/admin/users`),
        axios.get(`${API}/admin/users/pending`),
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/charges`),
      ]);
      setOrders(ord.data);
      setProducts(prod.data);
      setUsers(usr.data);
      setPending(pend.data);
      setStats(sts.data);
      setCharges(chrg.data);
    } catch (e) { toast.error("Failed to load data"); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status`, { status });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      toast.success(`Order ${status}`);
    } catch { toast.error("Failed to update"); }
  };

  const approveUser = async (userId, approved) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/approve`, { approved });
      setPending((prev) => prev.filter((u) => u.id !== userId));
      toast.success(approved ? "User approved" : "User rejected");
    } catch { toast.error("Failed"); }
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price) return toast.error("Name and price required");
    try {
      const res = await axios.post(`${API}/products`, newProduct);
      setProducts((p) => [...p, res.data]);
      setNewProduct({ name: "", category: "food", price: "", unit: "", description: "" });
      toast.success("Product added");
    } catch { toast.error("Failed to add"); }
  };

  const updateProduct = async () => {
    try {
      const res = await axios.put(`${API}/products/${editProduct.id}`, editProduct);
      setProducts((p) => p.map((x) => x.id === editProduct.id ? res.data : x));
      setEditProduct(null);
      toast.success("Product updated");
    } catch { toast.error("Failed to update"); }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`${API}/products/${id}`);
      setProducts((p) => p.filter((x) => x.id !== id));
      toast.success("Product removed");
    } catch { toast.error("Failed"); }
  };

  const toggleFeatured = async (p) => {
    try {
      const res = await axios.put(`${API}/products/${p.id}`, { featured: !p.featured });
      setProducts((prev) => prev.map((x) => x.id === p.id ? res.data : x));
      toast.success(res.data.featured ? "Marked as featured" : "Removed from featured");
    } catch { toast.error("Failed"); }
  };

  const saveCharges = async () => {
    try {
      await axios.put(`${API}/admin/charges`, charges);
      toast.success("Charges saved");
    } catch { toast.error("Failed to save"); }
  };

  const STATUS_NEXT = {
    pending: ["accepted", "cancelled"],
    accepted: ["on_the_way", "cancelled"],
    on_the_way: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cd-surface)" }}>
      {/* Admin header */}
      <div className="admin-header">
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div>
            <div style={{ color: "var(--cd-muted)", fontSize: 10, letterSpacing: "0.5px" }}>CHANDRADIP ADMIN</div>
            <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginTop: 3 }}>Dashboard</div>
          </div>
          <button onClick={logout} style={{ background: "none", border: "1px solid var(--cd-muted)", borderRadius: 8, color: "var(--cd-muted)", padding: "6px 14px", cursor: "pointer", fontSize: 12 }}>Sign out</button>
        </div>
        <div className="metric-grid">
          <div className="metric-card">
            <div className="metric-value" style={{ color: "#F0A500" }}>{stats.pendingOrders ?? 0}</div>
            <div className="metric-label">Pending orders</div>
          </div>
          <div className="metric-card">
            <div className="metric-value" style={{ color: "#5DCAA5" }}>{stats.todayOrders ?? 0}</div>
            <div className="metric-label">Orders today</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">₹{stats.todayRevenue ?? 0}</div>
            <div className="metric-label">Today's revenue</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{stats.totalOrders ?? 0}</div>
            <div className="metric-label">Total orders</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#fff", borderBottom: "1px solid var(--cd-border)", overflowX: "auto" }}>
        {TABS.map((t) => (
          <div key={t} onClick={() => setTab(t)}
            style={{ padding: "12px 20px", cursor: "pointer", fontWeight: 600, fontSize: 13, whiteSpace: "nowrap",
              color: tab === t ? "var(--cd-purple)" : "var(--cd-text-light)",
              borderBottom: tab === t ? "2px solid var(--cd-purple)" : "2px solid transparent" }}>
            {t} {t === "Orders" && pending.length > 0 && <span style={{ background: "#F0A500", color: "#412402", borderRadius: 10, padding: "1px 6px", fontSize: 10, marginLeft: 4 }}>{orders.filter((o) => o.status === "pending").length}</span>}
          </div>
        ))}
      </div>

      <div style={{ padding: "16px 20px" }}>

        {/* ORDERS TAB */}
        {tab === "Orders" && (
          <>
            {orders.length === 0 ? <div style={{ textAlign: "center", padding: 40, color: "var(--cd-text-light)" }}>No orders yet</div>
              : orders.map((o) => (
              <div key={o.id} className="card">
                <div className="flex-between" style={{ marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{o.userName} · Room {o.roomNumber || "—"}</div>
                    <div style={{ fontSize: 12, color: "var(--cd-text-light)" }}>{o.items?.map((i) => `${i.name} ×${i.quantity}`).join(", ")}</div>
                  </div>
                  <span className={`badge badge-${o.status}`}>{o.status === "on_the_way" ? "On way" : o.status}</span>
                </div>
                <div className="flex-between">
                  <div style={{ fontWeight: 700, color: "var(--cd-purple)" }}>₹{o.total}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {STATUS_NEXT[o.status]?.map((s) => (
                      <button key={s} onClick={() => updateStatus(o.id, s)}
                        className={s === "cancelled" ? "btn-danger" : "btn-accept"}
                        style={{ fontSize: 11, padding: "6px 12px" }}>
                        {s === "accepted" ? "Accept" : s === "on_the_way" ? "Out for delivery" : s === "delivered" ? "Delivered" : "Cancel"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* PRODUCTS TAB */}
        {tab === "Products" && (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Add new product</div>
              <div className="form-group">
                <label className="form-label">Product name</label>
                <input className="form-input" placeholder="e.g. Maggi noodles" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={newProduct.category} onChange={(e) => setNewProduct((p) => ({ ...p, category: e.target.value }))}>
                  <option value="food">Food</option>
                  <option value="cosmetics">Cosmetics</option>
                  <option value="stationery">Stationery</option>
                  <option value="essentials">Essentials</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (₹)</label>
                  <input className="form-input" type="number" placeholder="60" value={newProduct.price} onChange={(e) => setNewProduct((p) => ({ ...p, price: e.target.value }))} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Unit / size</label>
                  <input className="form-input" placeholder="e.g. 100ml" value={newProduct.unit} onChange={(e) => setNewProduct((p) => ({ ...p, unit: e.target.value }))} />
                </div>
              </div>
              <button className="btn-primary" onClick={addProduct}>Add product</button>
            </div>

            {editProduct && (
              <div className="card" style={{ marginBottom: 16, border: "1.5px solid var(--cd-purple)" }}>
                <div style={{ fontWeight: 600, marginBottom: 12, color: "var(--cd-purple)" }}>Edit: {editProduct.name}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Name</label>
                    <input className="form-input" value={editProduct.name} onChange={(e) => setEditProduct((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Price (₹)</label>
                    <input className="form-input" type="number" value={editProduct.price} onChange={(e) => setEditProduct((p) => ({ ...p, price: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <input className="form-input" value={editProduct.unit} onChange={(e) => setEditProduct((p) => ({ ...p, unit: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={updateProduct} style={{ flex: 1 }}>Save changes</button>
                  <button className="btn-secondary" onClick={() => setEditProduct(null)} style={{ flex: 1 }}>Cancel</button>
                </div>
              </div>
            )}

            {products.map((p) => (
              <div key={p.id} className="card">
                <div className="flex-between">
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "var(--cd-text-light)" }}>{p.category} · {p.unit}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {p.featured && <span className="badge" style={{ background: "#FFF8E6", color: "#633806" }}>⭐ Featured</span>}
                    <div style={{ fontWeight: 700, color: "var(--cd-purple)" }}>₹{p.price}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button className="btn-accept" style={{ fontSize: 11, flex: 1 }} onClick={() => setEditProduct(p)}>Edit</button>
                  <button onClick={() => toggleFeatured(p)} style={{ flex: 1, background: p.featured ? "#FFF8E6" : "var(--cd-surface)", color: "#633806", border: "none", borderRadius: 8, padding: "8px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                    {p.featured ? "Unfeature" : "⭐ Feature"}
                  </button>
                  <button className="btn-danger" style={{ fontSize: 11, flex: 1 }} onClick={() => deleteProduct(p.id)}>Remove</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* CHARGES TAB */}
        {tab === "Charges" && (
          <div className="card">
            <div style={{ fontWeight: 600, marginBottom: 14 }}>Delivery & billing settings</div>
            <div className="form-group">
              <label className="form-label">Delivery charge (₹)</label>
              <input className="form-input" type="number" value={charges.deliveryCharge} onChange={(e) => setCharges((c) => ({ ...c, deliveryCharge: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Handling charge (₹)</label>
              <input className="form-input" type="number" value={charges.handlingCharge} onChange={(e) => setCharges((c) => ({ ...c, handlingCharge: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">GST / Tax (%)</label>
              <input className="form-input" type="number" value={charges.taxPercent} onChange={(e) => setCharges((c) => ({ ...c, taxPercent: +e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Extra charge label</label>
                <input className="form-input" placeholder="e.g. Late night fee" value={charges.extraChargeLabel} onChange={(e) => setCharges((c) => ({ ...c, extraChargeLabel: e.target.value }))} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Extra charge (₹)</label>
                <input className="form-input" type="number" value={charges.extraCharge} onChange={(e) => setCharges((c) => ({ ...c, extraCharge: +e.target.value }))} />
              </div>
            </div>
            <button className="btn-primary" onClick={saveCharges}>Save all charges</button>
          </div>
        )}

        {/* USERS TAB */}
        {tab === "Users" && (
          <>
            {pending.length > 0 && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 10, color: "#633806" }}>⏳ Pending approvals</div>
                {pending.map((u) => (
                  <div key={u.id} className="card">
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: 12, color: "var(--cd-text-light)", marginBottom: 10 }}>{u.email} · Room {u.roomNumber}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="btn-accept" style={{ flex: 1, fontSize: 12 }} onClick={() => approveUser(u.id, true)}>Approve</button>
                      <button className="btn-danger" style={{ flex: 1, fontSize: 12 }} onClick={() => approveUser(u.id, false)}>Reject</button>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--cd-border)", margin: "16px 0" }} />
              </>
            )}
            <div style={{ fontWeight: 600, marginBottom: 10 }}>Active students ({users.length})</div>
            {users.map((u) => (
              <div key={u.id} className="card">
                <div style={{ fontWeight: 600 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "var(--cd-text-light)" }}>{u.email} · Room {u.roomNumber}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
