import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../context/AuthContext";

const STEPS = [
  { key: "pending", label: "Placed", icon: "📋" },
  { key: "accepted", label: "Accepted", icon: "✅" },
  { key: "on_the_way", label: "On way", icon: "🛵" },
  { key: "delivered", label: "Delivered", icon: "🏠" },
];

const statusIndex = (s) => STEPS.findIndex((x) => x.key === s);

export default function OrderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const res = await axios.get(`${API}/orders/${id}`);
      setOrder(res.data);
    } catch { navigate("/orders"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <div className="spinner" />;
  if (!order) return null;

  const si = order.status === "cancelled" ? -1 : statusIndex(order.status);

  return (
    <div className="page-content" style={{ padding: "0 0 90px" }}>
      <div style={{ background: "var(--cd-night)", padding: "16px 20px" }}>
        <div style={{ color: "var(--cd-muted)", fontSize: 11, letterSpacing: "0.5px" }}>ORDER STATUS</div>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 600, marginTop: 4 }}>#{id.slice(-6).toUpperCase()}</div>
      </div>

      {/* Status badge */}
      <div style={{ padding: "16px 20px" }}>
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600 }}>Order status</div>
            <span className={`badge badge-${order.status}`}>
              {order.status === "on_the_way" ? "On the way" : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </span>
          </div>

          {order.status === "cancelled" ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>❌</div>
              <div style={{ color: "#A32D2D", fontWeight: 600 }}>Order cancelled</div>
              <div style={{ color: "var(--cd-text-light)", fontSize: 12, marginTop: 4 }}>Contact admin for help</div>
            </div>
          ) : (
            <>
              <div className="tracker-steps">
                {STEPS.map((step, i) => (
                  <React.Fragment key={step.key}>
                    <div className={`step-circle ${i < si ? "step-done" : i === si ? "step-active" : "step-pending"}`}>
                      {i <= si ? step.icon : "○"}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`step-line ${i < si ? "done" : "pending"}`} />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="tracker-labels">
                {STEPS.map((step, i) => (
                  <div key={step.key} className="tracker-label"
                    style={{ color: i <= si ? "var(--cd-purple)" : "var(--cd-text-light)", width: 60 }}>
                    {step.label}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Order items */}
      <div style={{ padding: "0 20px" }}>
        <div className="section-title">Items ordered</div>
        <div className="card">
          {order.items.map((item, i) => (
            <div key={i} className="flex-between" style={{ padding: "6px 0", borderBottom: i < order.items.length - 1 ? "1px solid var(--cd-border)" : "none" }}>
              <div>
                <div style={{ fontWeight: 500 }}>{item.name}</div>
                <div style={{ fontSize: 12, color: "var(--cd-text-light)" }}>× {item.quantity}</div>
              </div>
              <div style={{ fontWeight: 600, color: "var(--cd-purple)" }}>₹{item.price * item.quantity}</div>
            </div>
          ))}
          <div style={{ borderTop: "1.5px solid var(--cd-border)", marginTop: 10, paddingTop: 10 }}>
            <div className="billing-row"><span className="label">Delivery</span><span className="amount">₹{order.deliveryCharge}</span></div>
            <div className="billing-row"><span className="label">Handling</span><span className="amount">₹{order.handlingCharge}</span></div>
            {order.extraCharge > 0 && <div className="billing-row"><span className="label">{order.extraChargeLabel}</span><span className="amount">₹{order.extraCharge}</span></div>}
            <div className="billing-row"><span className="label">Tax</span><span className="amount">₹{order.tax}</span></div>
            <div className="billing-row total"><span>Total</span><span className="amount">₹{order.total}</span></div>
          </div>
        </div>

        <div className="card">
          <div className="billing-row"><span className="label">Payment</span><span className="amount">{order.paymentMethod === "cod" ? "Cash on delivery" : "UPI / QR"}</span></div>
          <div className="billing-row"><span className="label">Deliver to</span><span className="amount">Room {order.roomNumber}</span></div>
          <div className="billing-row"><span className="label">Placed at</span><span className="amount">{new Date(order.createdAt).toLocaleString("en-IN")}</span></div>
          {order.note && <div className="billing-row"><span className="label">Note</span><span className="amount">{order.note}</span></div>}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--cd-text-light)", marginTop: 8 }}>
          Page auto-refreshes every 15 seconds
        </p>
      </div>
    </div>
  );
}
