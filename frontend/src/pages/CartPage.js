import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { API } from "../context/AuthContext";
import toast from "react-hot-toast";

export default function CartPage() {
  const { items, updateQty, removeItem, clearCart, total, count } = useCart();
  const navigate = useNavigate();
  const [charges, setCharges] = useState({ deliveryCharge: 20, handlingCharge: 10, taxPercent: 5, extraCharge: 0, extraChargeLabel: "" });
  const [payMethod, setPayMethod] = useState("cod");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get(`${API}/admin/charges`).then((r) => setCharges(r.data)).catch(() => {});
  }, []);

  const tax = Math.round((total * charges.taxPercent) / 100);
  const grandTotal = total + charges.deliveryCharge + charges.handlingCharge + charges.extraCharge + tax;

  const placeOrder = async () => {
    if (items.length === 0) return toast.error("Cart is empty");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/orders`, {
        items,
        paymentMethod: payMethod,
        note,
      });
      clearCart();
      toast.success("Order placed! Waiting for confirmation.");
      navigate(`/orders/${res.data.orderId}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to place order");
    } finally { setLoading(false); }
  };

  if (items.length === 0)
    return (
      <div className="page-content" style={{ textAlign: "center", paddingTop: 60 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
        <div style={{ color: "var(--cd-text-light)", fontSize: 15 }}>Your cart is empty</div>
        <button className="btn-primary" style={{ marginTop: 24, width: "auto", padding: "12px 32px" }} onClick={() => navigate("/")}>Browse products</button>
      </div>
    );

  return (
    <div className="page-content" style={{ padding: "0 0 90px" }}>
      <div style={{ padding: "16px 20px", background: "var(--cd-night)" }}>
        <div style={{ color: "#fff", fontSize: 16, fontWeight: 600 }}>Your cart · {count} items</div>
      </div>

      {/* Items */}
      <div style={{ padding: "16px 20px", background: "var(--cd-surface)" }}>
        {items.map((item) => (
          <div key={item.productId} className="card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
              <div style={{ color: "var(--cd-purple)", fontWeight: 600 }}>₹{item.price} each</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => updateQty(item.productId, item.quantity - 1)}
                style={{ width: 28, height: 28, border: "1.5px solid var(--cd-border)", borderRadius: "50%", background: "#fff", cursor: "pointer", fontSize: 16 }}>−</button>
              <span style={{ fontWeight: 600, minWidth: 20, textAlign: "center" }}>{item.quantity}</span>
              <button onClick={() => updateQty(item.productId, item.quantity + 1)}
                style={{ width: 28, height: 28, border: "none", borderRadius: "50%", background: "var(--cd-purple)", color: "#fff", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
            <div style={{ fontWeight: 600, minWidth: 48, textAlign: "right" }}>₹{item.price * item.quantity}</div>
            <button onClick={() => removeItem(item.productId)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cd-text-light)", fontSize: 18 }}>✕</button>
          </div>
        ))}
      </div>

      {/* Billing */}
      <div style={{ padding: "16px 20px" }}>
        <div className="section-title">Bill summary</div>
        <div className="card">
          <div className="billing-row"><span className="label">Subtotal</span><span className="amount">₹{total}</span></div>
          <div className="billing-row"><span className="label">Delivery charge</span><span className="amount">₹{charges.deliveryCharge}</span></div>
          <div className="billing-row"><span className="label">Handling charge</span><span className="amount">₹{charges.handlingCharge}</span></div>
          {charges.extraCharge > 0 && (
            <div className="billing-row"><span className="label">{charges.extraChargeLabel || "Extra charge"}</span><span className="amount">₹{charges.extraCharge}</span></div>
          )}
          <div className="billing-row"><span className="label">GST ({charges.taxPercent}%)</span><span className="amount">₹{tax}</span></div>
          <div className="billing-row total"><span>Total</span><span className="amount">₹{grandTotal}</span></div>
        </div>
      </div>

      {/* Payment */}
      <div style={{ padding: "0 20px 16px" }}>
        <div className="section-title">Payment method</div>
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <div className={`pay-option ${payMethod === "cod" ? "selected" : ""}`} onClick={() => setPayMethod("cod")}>
            <div style={{ fontSize: 22 }}>💵</div>
            <p>Cash on delivery</p>
          </div>
          <div className={`pay-option ${payMethod === "upi" ? "selected" : ""}`} onClick={() => setPayMethod("upi")}>
            <div style={{ fontSize: 22 }}>📱</div>
            <p>UPI / QR</p>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Add a note (optional)</label>
          <input className="form-input" placeholder="E.g. Leave at door, Room 204" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={placeOrder} disabled={loading}>
          {loading ? "Placing order..." : `Place order · ₹${grandTotal}`}
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: "var(--cd-text-light)", marginTop: 10 }}>
          Next-day delivery to your hostel room
        </p>
      </div>
    </div>
  );
}
