// backend/routes/authorities.js
import express from "express";
import { getAuthorities, saveAuthorities } from "../utils/db.js";

const router = express.Router();

// GET all
router.get("/", (req, res) => {
  const arr = getAuthorities();
  res.json(arr);
});

// GET by id
router.get("/:id", (req, res) => {
  const arr = getAuthorities();
  const found = arr.find(a => a.id === req.params.id);
  if (!found) return res.status(404).json({ error: "Not found" });
  res.json(found);
});

// Admin-only endpoints (create/update) could be added; keeping simple.
export default router;