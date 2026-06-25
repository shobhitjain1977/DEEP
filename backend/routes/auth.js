const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../firebase");

// Student registration (requires admin approval)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    const existing = await db.collection("users").where("email", "==", email).get();
    if (!existing.empty)
      return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    const userRef = await db.collection("users").add({
      name,
      email,
      password: hashed,
      role: "student",
      approved: false,
      createdAt: new Date().toISOString(),
    });

    res.status(201).json({
      message: "Registration submitted. Wait for admin approval.",
      userId: userRef.id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Student login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const snap = await db.collection("users").where("email", "==", email).get();
    if (snap.empty) return res.status(400).json({ error: "Invalid credentials" });

    const userDoc = snap.docs[0];
    const user = userDoc.data();

    if (!user.approved)
      return res.status(403).json({ error: "Account pending admin approval" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { id: userDoc.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: userDoc.id,
        name: user.name,
        email: user.email,
        roomNumber: user.roomNumber,
        hostelBlock: user.hostelBlock,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin login (separate, hardcoded admin email from env)
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email !== process.env.ADMIN_EMAIL ||
      password !== process.env.ADMIN_PASSWORD
    )
      return res.status(401).json({ error: "Invalid admin credentials" });

    const token = jwt.sign(
      { id: "admin", email, role: "admin", name: "Rishi" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, user: { id: "admin", name: "Rishi", role: "admin" } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
