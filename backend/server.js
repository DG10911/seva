// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import authorityRoutes from "./routes/authorities.js";
import reportsRoutes from "./routes/reports.js";
import geocodeRoutes from "./routes/geocode.js";
import orsRoutes from "./routes/ors.js";

dotenv.config();

// --- basic setup ---
const app = express();
app.use(cors());            // allow all origins (fine for dev + same-origin prod)
app.use(express.json());

// --- API routes ---
app.use("/api/auth", authRoutes);
app.use("/api/authorities", authorityRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/ors", orsRoutes);

// Simple ORS proxy endpoint (using global fetch in Node 20+)
app.post("/api/ors/route", async (req, res) => {
  try {
    const { coordinates, profile = "driving-car" } = req.body;
    const orsKey = process.env.ORS_KEY;

    if (!orsKey) {
      return res.status(400).json({ error: "ORS_KEY not configured" });
    }

    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": orsKey
      },
      body: JSON.stringify({ coordinates })
    });

    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    console.error("ORS proxy error:", err);
    res.status(500).json({ error: "ORS proxy failed", details: err.message });
  }
});

// health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

// --- serve React frontend build from backend/public ---

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve static files from React build
app.use(express.static(path.join(__dirname, "public")));

// SPA fallback: any non-API route should return index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// --- start server ---

const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`SEVA backend running on port ${PORT}`);
});