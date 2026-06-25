import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../context/AuthContext";

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get(`${API}/orders/my`).then((r) => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  return (
    <div className="page-content" style={{ padding: "0 0 90px" }}>
      <div style={{ background: "var(--cd-night)", padding: "16px 20px" }}>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>My orders</div>
      </div>
      <div style={{ padding: "16px 20px", background: "var(--cd-surface)" }}>
        {orders.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: 40 }}>📋</div>
            <div style={{ color: "var(--cd-text-light)", marginTop: 12 }}>No orders yet. Go shop!</div>
            <button className="btn-primary" style={{ marginTop: 20, width: "auto", padding: "11px 28px" }} onClick={() => navigate("/")}>Browse</button>
          </div>
        ) : orders.map((o) => (
          <div key={o.id} className="card" style={{ cursor: "pointer" }} onClick={() => navigate(`/orders/${o.id}`)}>
            <div className="flex-between" style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 600 }}>#{o.id.slice(-6).toUpperCase()}</div>
              <span className={`badge badge-${o.status}`}>
                {o.status === "on_the_way" ? "On the way" : o.status.charAt(0).toUpperCase() + o.status.slice(1)}
              </span>
            </div>
            <div style={{ color: "var(--cd-text-light)", fontSize: 12, marginBottom: 4 }}>
              {o.items.map((i) => i.name).join(", ")}
            </div>
            <div className="flex-between">
              <div style={{ color: "var(--cd-text-light)", fontSize: 11 }}>{new Date(o.createdAt).toLocaleDateString("en-IN")}</div>
              <div style={{ fontWeight: 700, color: "var(--cd-purple)" }}>₹{o.total}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
