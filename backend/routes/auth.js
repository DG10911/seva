// backend/routes/auth.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getUsers, saveUsers } from "../utils/db.js";

const router = express.Router();

// Signup
router.post("/signup", (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: "Missing fields" });

  const users = getUsers();
  const exists = users.find(u => u.username === username && u.role === role);
  if (exists) return res.status(400).json({ error: "Account already exists" });

  const user = { id: uuidv4(), username, password, role, createdAt: new Date().toISOString() };
  users.push(user);
  saveUsers(users);
  // Return user (do not return password in real app)
  const { password: _p, ...safe } = user;
  res.status(201).json(safe);
});

// Login
router.post("/login", (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: "Missing fields" });

  const users = getUsers();
  const found = users.find(u => u.username === username && u.password === password && u.role === role);
  if (!found) return res.status(400).json({ error: "Invalid credentials" });

  const { password: _p, ...safe } = found;
  res.json(safe);
});

export default router;