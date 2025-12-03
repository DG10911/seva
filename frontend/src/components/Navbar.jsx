import React from "react";
import { Link } from "react-router-dom";

export default function Navbar({ user, onLogout }){
  return (
    <header className="navbar">
      <div className="brand" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        
        {/* Modern Bettiah SEVA Logo */}
        <img 
          src="/logo-seva.svg"
          alt="Bettiah SEVA" 
          style={{ height: 36 }}
        />

      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Link to="/authorities" className="nav-btn">Authorities</Link>

        {user ? (
          <>
            <span className="user-badge">{user.username} ({user.role})</span>
            <button className="nav-btn" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/signup" className="nav-btn">Signup</Link>
            <Link to="/login" className="nav-btn">Login</Link>
          </>
        )}
      </nav>
    </header>
  );
}