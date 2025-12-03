// src/components/AuthoritiesList.jsx
import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function AuthoritiesList() {
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAuthorities() {
      setLoading(true);
      setError("");

      // 1️⃣ Try backend API first (Render + local backend)
      try {
        if (process.env.REACT_APP_API_BASE) {
          const data = await api.getAuthorities();
          if (Array.isArray(data) && data.length > 0) {
            setAuthorities(data);
            // cache in localStorage for faster next time
            localStorage.setItem("seva_authorities", JSON.stringify(data));
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn("API /authorities failed, will try static JSON.", e);
      }

      // 2️⃣ Fallback: static JSON bundled with app (works on ANY device)
      try {
        const resp = await fetch("/data/authorities.json");
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();
        if (Array.isArray(json) && json.length > 0) {
          setAuthorities(json);
          localStorage.setItem("seva_authorities", JSON.stringify(json));
          setLoading(false);
          return;
        }
      } catch (e) {
        console.error("Static authorities.json failed:", e);
      }

      // 3️⃣ Last fallback: whatever is in localStorage (if present)
      try {
        const ls = JSON.parse(
          localStorage.getItem("seva_authorities") || "[]"
        );
        if (Array.isArray(ls) && ls.length > 0) {
          setAuthorities(ls);
          setLoading(false);
          return;
        }
      } catch (e) {
        console.warn("localStorage parse failed", e);
      }

      setError("Could not load authorities. Please try again later.");
      setLoading(false);
    }

    loadAuthorities();
  }, []);

  if (loading) {
    return <p>Loading authorities…</p>;
  }

  if (error) {
    return <p style={{ color: "red" }}>{error}</p>;
  }

  if (!authorities.length) {
    return <p>No authorities configured.</p>;
  }

  return (
    <div className="container">
      <h2>Authorities — Bettiah</h2>
      <p className="muted">
        Official contacts for sanitation, public works, ward officers and city
        leadership in Bettiah.
      </p>
      <div className="grid">
        {authorities.map((a) => (
          <div key={a.id} className="card">
            <h3>{a.name}</h3>
            <p>
              <b>Department:</b> {a.department}
            </p>
            <p>
              {a.city}, {a.state} — {a.pincode}
            </p>
            <p>
              <b>Phone:</b> {a.phone}
              <br />
              <b>Email:</b> {a.email}
            </p>
            {a.wards && a.wards.length > 0 && (
              <details style={{ marginTop: 8 }}>
                <summary>Wards covered ({a.wards.length})</summary>
                <ul style={{ marginTop: 4 }}>
                  {a.wards.map((w) => (
                    <li key={w.id}>
                      {w.name} — {w.phone}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}