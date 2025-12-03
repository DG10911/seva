// backend/routes/ors.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

/**
 * POST /api/ors/route
 * Body: { coordinates: [[lon, lat], [lon, lat], ...], profile?: "driving-car" }
 */
router.post("/route", async (req, res) => {
  try {
    const coords = req.body?.coordinates;
    const profile = req.body?.profile || "driving-car";

    if (!coords || !Array.isArray(coords) || coords.length < 2) {
      return res.status(400).json({ error: "coordinates must be provided as array of [lon,lat] pairs" });
    }

    const ORS_KEY = process.env.ORS_KEY;
    if (!ORS_KEY) {
      return res.status(500).json({ error: "ORS_KEY not configured" });
    }

    const resp = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}/geojson`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": ORS_KEY
      },
      body: JSON.stringify({ coordinates: coords })
    });

    const json = await resp.json();
    if (!resp.ok) {
      // forward ORS error body and status
      return res.status(resp.status).json(json);
    }

    return res.json(json);
  } catch (err) {
    console.error("ORS proxy error:", err);
    return res.status(500).json({ error: "ORS proxy failed", details: err.message });
  }
});

export default router;