const express = require("express");
const router = express.Router();
const { db } = require("../firebase");
const { adminMiddleware } = require("../middleware/auth");

// Get all pending user approvals
router.get("/users/pending", adminMiddleware, async (req, res) => {
  try {
    const snap = await db.collection("users").where("approved", "==", false).get();
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data(), password: undefined })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve or reject a student account
router.put("/users/:id/approve", adminMiddleware, async (req, res) => {
  try {
    const { approved } = req.body;
    await db.collection("users").doc(req.params.id).update({ approved });
    res.json({ message: approved ? "User approved" : "User rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all approved users
router.get("/users", adminMiddleware, async (req, res) => {
  try {
    const snap = await db.collection("users").where("approved", "==", true).get();
    res.json(
      snap.docs.map((d) => {
        const u = d.data();
        return { id: d.id, name: u.name, email: u.email, roomNumber: u.roomNumber };
      })
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get charge settings
router.get("/charges", adminMiddleware, async (req, res) => {
  try {
    const doc = await db.collection("settings").doc("charges").get();
    res.json(
      doc.exists
        ? doc.data()
        : { deliveryCharge: 20, handlingCharge: 10, taxPercent: 5, extraCharge: 0, extraChargeLabel: "" }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update charge settings
router.put("/charges", adminMiddleware, async (req, res) => {
  try {
    const { deliveryCharge, handlingCharge, taxPercent, extraCharge, extraChargeLabel } = req.body;
    await db
      .collection("settings")
      .doc("charges")
      .set({
        deliveryCharge: Number(deliveryCharge ?? 20),
        handlingCharge: Number(handlingCharge ?? 10),
        taxPercent: Number(taxPercent ?? 5),
        extraCharge: Number(extraCharge ?? 0),
        extraChargeLabel: extraChargeLabel || "",
      });
    res.json({ message: "Charges updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save admin FCM token for push notifications
router.put("/fcm-token", adminMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    await db.collection("settings").doc("admin").set({ fcmToken: token }, { merge: true });
    res.json({ message: "FCM token saved" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard stats
router.get("/stats", adminMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const snap = await db.collection("orders").get();
    const orders = snap.docs.map((d) => d.data());
    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
    const revenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const pending = orders.filter((o) => o.status === "pending").length;
    res.json({
      totalOrders: snap.size,
      todayOrders: todayOrders.length,
      todayRevenue: revenue,
      pendingOrders: pending,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
