import React from "react";
import { Link } from "react-router-dom";

export default function Landing(){
  return (
    <div className="centered container">
      <h2>Welcome to SEVA — Bettiah</h2>
      <p>Report civic issues, follow action, support reports, and view authorities.</p>
      <div className="cta-row">
        <Link className="btn" to="/signup">Signup</Link>
        <Link className="btn-outline" to="/login">Login</Link>
      </div>
    </div>
  );
}