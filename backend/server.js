// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import net from "net";
import geocodeRoutes from "./routes/geocode.js";
import orsRoutes from "./routes/ors.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => console.log(`SEVA backend running on ${PORT}`));
const app = express();
app.use(cors());
app.use(express.json());
// Serve React frontend
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
// mount routes
import authRoutes from "./routes/auth.js";
import authorityRoutes from "./routes/authorities.js";
import reportsRoutes from "./routes/reports.js";
app.use(cors({ origin: ["http://localhost:3000"] }));
app.use("/api/auth", authRoutes);
app.use("/api/authorities", authorityRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/geocode", geocodeRoutes);
app.use("/api/ors", orsRoutes);
// ORS proxy endpoint (simple)
import fetch from "node-fetch";
app.post("/api/ors/route", async (req, res) => {
  try {
    const { coordinates, profile = "driving-car" } = req.body;
    if (!process.env.ORS_KEY) return res.status(400).json({ error: "ORS_KEY not configured" });
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.ORS_KEY
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
function getFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on("error", () => {
      // If port is taken, try next one
      resolve(getFreePort(startPort + 1));
    });
  });
}
// serve static db example or health
app.get("/api/health", (req, res) => res.json({ ok: true, timestamp: Date.now() }));

const START_PORT = parseInt(process.env.PORT) || 5000;

getFreePort(START_PORT).then((availablePort) => {
  app.listen(availablePort, () => {
    console.log(`SEVA backend running on http://localhost:${availablePort}`);

    // Also helpful: write chosen port to a small file (optional)
    console.log(`Final port selected: ${availablePort}`);
  });
});