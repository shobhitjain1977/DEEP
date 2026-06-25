const express = require("express");
const router = express.Router();
const { db, messaging } = require("../firebase");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");

// Helper: get charge settings from Firestore
async function getCharges() {
  const doc = await db.collection("settings").doc("charges").get();
  return doc.exists
    ? doc.data()
    : { deliveryCharge: 20, handlingCharge: 10, taxPercent: 5, extraCharge: 0, extraChargeLabel: "" };
}

// Place an order (student)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { items, paymentMethod, note } = req.body;
    // items = [{ productId, name, price, quantity }]
    if (!items || items.length === 0)
      return res.status(400).json({ error: "No items in order" });

    const charges = await getCharges();
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const tax = Math.round((subtotal * charges.taxPercent) / 100);
    const total =
      subtotal + charges.deliveryCharge + charges.handlingCharge + charges.extraCharge + tax;

    const orderRef = await db.collection("orders").add({
      userId: req.user.id,
      userName: req.user.name,
      userEmail: req.user.email,
      items,
      subtotal,
      deliveryCharge: charges.deliveryCharge,
      handlingCharge: charges.handlingCharge,
      extraCharge: charges.extraCharge,
      extraChargeLabel: charges.extraChargeLabel,
      taxPercent: charges.taxPercent,
      tax,
      total,
      paymentMethod: paymentMethod || "cod",
      note: note || "",
      status: "pending", // pending | accepted | on_the_way | delivered | cancelled
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Notify admin via FCM if token stored
    try {
      const settingsDoc = await db.collection("settings").doc("admin").get();
      if (settingsDoc.exists && settingsDoc.data().fcmToken) {
        await messaging.send({
          token: settingsDoc.data().fcmToken,
          notification: {
            title: "New order on Chandradip!",
            body: `${req.user.name} placed an order — ₹${total}`,
          },
          data: { orderId: orderRef.id },
        });
      }
    } catch (_) {}

    res.status(201).json({ orderId: orderRef.id, total, status: "pending" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student's own orders
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const snap = await db
      .collection("orders")
      .where("userId", "==", req.user.id)
      .orderBy("createdAt", "desc")
      .get();
    const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order (student or admin)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const doc = await db.collection("orders").doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: "Order not found" });
    const order = { id: doc.id, ...doc.data() };
    if (req.user.role !== "admin" && order.userId !== req.user.id)
      return res.status(403).json({ error: "Not your order" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: update order status
router.put("/:id/status", adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["pending", "accepted", "on_the_way", "delivered", "cancelled"];
    if (!validStatuses.includes(status))
      return res.status(400).json({ error: "Invalid status" });

    await db.collection("orders").doc(req.params.id).update({
      status,
      updatedAt: new Date().toISOString(),
    });
    res.json({ orderId: req.params.id, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all orders
router.get("/", adminMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    let query = db.collection("orders").orderBy("createdAt", "desc");
    if (status) query = query.where("status", "==", status);
    const snap = await query.get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
