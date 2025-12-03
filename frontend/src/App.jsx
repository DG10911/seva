// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardUser from "./components/DashboardUser";
import DashboardAdmin from "./components/DashboardAdmin";
import DashboardAuthority from "./components/DashboardAuthority";
import Navbar from "./components/Navbar";
import AuthoritiesList from "./components/AuthoritiesList";
import Footer from "./components/Footer";
import LoadingSplash from "./components/LoadingSplash";

function App() {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("seva_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [bootLoading, setBootLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // small splash delay
    const t = setTimeout(() => setBootLoading(false), 1000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!user) {
      // stay on landing unless logged in
    }
  }, [user]);

  function handleLogin(u) {
    setUser(u);
    localStorage.setItem("seva_user", JSON.stringify(u));
    if (u.role === "admin") navigate("/admin");
    else if (u.role === "authority") navigate("/authority");
    else navigate("/user");
  }

  function handleLogout() {
    const role = user?.role;
    localStorage.removeItem("seva_user");
    setUser(null);
    if (role === "admin") {
      alert("Thank you, boss");
    } else {
      alert("Dhanyavad");
    }
    navigate("/");
  }

  // show splash on first load
  if (bootLoading) {
    return <LoadingSplash />;
  }

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup onSignup={handleLogin} />} />
          <Route path="/authorities" element={<AuthoritiesList />} />
          <Route path="/user" element={<DashboardUser user={user} />} />
          <Route path="/admin" element={<DashboardAdmin user={user} />} />
          <Route
            path="/authority"
            element={<DashboardAuthority user={user} />}
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;