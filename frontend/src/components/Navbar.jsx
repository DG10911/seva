import React from "react";
import { Link } from "react-router-dom";

export default function Navbar({ user, onLogout }){
  return (
    <header className="navbar">
      <div className="brand">
        <img src="/logo192.png" alt="SEVA logo" style={{height:40, marginRight:10}}/>
        <h1>SEVA - Bettiah</h1>
      </div>
      <nav>
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