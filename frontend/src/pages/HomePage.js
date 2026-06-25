import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { API } from "../context/AuthContext";
import toast from "react-hot-toast";

const CATEGORIES = [
  { key: "all", label: "All", icon: "⊞" },
  { key: "food", label: "Food", icon: "🍜" },
  { key: "cosmetics", label: "Cosmetics", icon: "✨" },
  { key: "stationery", label: "Stationery", icon: "✏️" },
  { key: "essentials", label: "Essentials", icon: "📦" },
];

export default function HomePage() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = category !== "all" ? { category } : {};
        const res = await axios.get(`${API}/products`, { params });
        setProducts(res.data);
      } catch { toast.error("Failed to load products"); }
      finally { setLoading(false); }
    })();
  }, [category]);

  const greet = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const catColor = (c) => ({
    food: "cat-food", cosmetics: "cat-cosmetics",
    stationery: "cat-stationery", essentials: "cat-essentials",
  }[c] || "cat-essentials");

  const catEmoji = (c) => ({
    food: "🍜", cosmetics: "✨", stationery: "✏️", essentials: "📦",
  }[c] || "📦");

  return (
    <div className="page-content">
      {/* Hero */}
      <div className="hero">
        <div className="hero-card">
          <div>
            <div className="hero-eyebrow">{greet()}, {user?.name?.split(" ")[0]}</div>
            <div className="hero-title">What do you need<br />delivered today?</div>
            <div className="hero-tag">
              🕐 Next-day delivery guaranteed
            </div>
          </div>
          <div className="hero-icon">📦</div>
        </div>
      </div>

      {/* Category pills */}
      <div className="pills-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            className={`pill ${category === c.key ? "active" : "inactive"}`}
            onClick={() => setCategory(c.key)}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* Products */}
      <div className="section">
        <div className="section-title">
          {category === "all" ? "Featured products" : CATEGORIES.find((c) => c.key === category)?.label}
        </div>
        {loading ? (
          <div className="spinner" />
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--cd-text-light)" }}>
            No products in this category yet.
          </div>
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <div key={p.id} className="product-card">
                <div className="product-img" style={{ background: { food: "#F0EBFF", cosmetics: "#FFF8E6", stationery: "#EAF3DE", essentials: "#FBEAF0" }[p.category] || "#F7F5FF" }}>
                  {catEmoji(p.category)}
                </div>
                <div className="product-body">
                  <span className={`product-cat ${catColor(p.category)}`}>{p.category}</span>
                  <div className="product-name">{p.name}</div>
                  <div className="product-unit">{p.unit}</div>
                  <div className="product-footer">
                    <div className="product-price">₹{p.price}</div>
                    <button
                      className="add-btn"
                      onClick={() => { addItem(p); toast.success(`${p.name} added`); }}
                    >+</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
