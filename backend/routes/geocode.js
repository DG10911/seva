// backend/routes/geocode.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// GET /api/geocode/reverse?lat=26.81&lon=84.51
router.get("/reverse", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Missing lat/lon" });

  try {
    // Use Nominatim reverse geocode. Provide a User-Agent and referer to be polite.
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "SEVA-App/1.0 (devanshgoenka@example.com)",
        "Accept-Language": "en"
      },
      // small timeout could be added if desired
    });

    if (!resp.ok) {
      const text = await resp.text();
      return res.status(resp.status).json({ error: "Nominatim error", details: text });
    }

    const json = await resp.json();
    res.json(json);
  } catch (err) {
    console.error("Geocode proxy error:", err);
    res.status(500).json({ error: "Geocode proxy failed", details: err.message });
  }
});

export default router;