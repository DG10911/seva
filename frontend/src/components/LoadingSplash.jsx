// src/components/LoadingSplash.jsx
import React from "react";

export default function LoadingSplash() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at top, #dbeafe, #eff6ff)",
      }}
    >
      <div
        style={{
          padding: 24,
          borderRadius: 24,
          background: "white",
          boxShadow:
            "0 20px 45px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(148, 163, 184, 0.1)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          className="logo-pulse"
          style={{
            width: 80,
            height: 80,
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "conic-gradient(from 180deg, #2563eb, #22c55e, #2563eb)",
          }}
        >
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: "999px",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src="/logo-seva.svg"
              alt="Bettiah SEVA"
              style={{ height: 40 }}
            />
          </div>
        </div>
        <h2 style={{ margin: 0, fontSize: 18 }}>Bettiah SEVA</h2>
        <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
          Loading citizen reports and live map…
        </p>
      </div>
    </div>
  );
}