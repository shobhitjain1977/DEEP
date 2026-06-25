const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Get all products (students & public)
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let query = db.collection("products").where("active", "==", true);
    if (category && category !== "all") query = query.where("category", "==", category);
    const snap = await query.get();
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add product (admin only)
router.post("/", adminMiddleware, async (req, res) => {
  try {
    const { name, category, price, description, unit, imageUrl } = req.body;
    if (!name || !category || !price)
      return res.status(400).json({ error: "name, category, price required" });

    const ref = await db.collection("products").add({
      name,
      category, // food | cosmetics | stationery | essentials
      price: Number(price),
      description: description || "",
      unit: unit || "",
      imageUrl: imageUrl || "",
      active: true,
      featured: false,
      createdAt: new Date().toISOString(),
    });
    const doc = await ref.get();
    res.status(201).json({ id: ref.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update product price, featured, active (admin only)
router.put("/:id", adminMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    if (updates.price) updates.price = Number(updates.price);
    await db.collection("products").doc(req.params.id).update(updates);
    const doc = await db.collection("products").doc(req.params.id).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete product (admin only)
router.delete("/:id", adminMiddleware, async (req, res) => {
  try {
    await db.collection("products").doc(req.params.id).update({ active: false });
    res.json({ message: "Product removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
