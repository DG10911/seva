import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function AuthForm({ mode="login", onAuth }){
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [confirm, setConfirm] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e){
    e.preventDefault();

    // If backend exists, attempt API call. Otherwise fallback to localStorage.
    if(process.env.REACT_APP_API_BASE){
      try {
        if(mode === "signup"){
          if(password !== confirm){ alert("Passwords must match"); return; }
          const res = await api.signup({ username, password, role });
          // NEW: do NOT auto-login – show success and go to login page
          alert("Signup successful. Please login to continue.");
          navigate("/login");
          return;
        } else {
          const res = await api.login({ username, password, role });
          // Successful login -> call onAuth to set session and redirect to dashboard
          onAuth({ username: res.username, role: res.role });
          return;
        }
      } catch(err){
        // fallback to localStorage mode if API failed
        console.warn("API auth failed, falling back to localStorage", err);
      }
    }

    // Fallback localStorage logic (demo)
    const usersRaw = localStorage.getItem("seva_accounts") || "[]";
    const accounts = JSON.parse(usersRaw);

    if(mode === "signup"){
      if(password !== confirm){ alert("Passwords must match"); return; }
      const exists = accounts.find(a => a.username === username && a.role === role);
      if(exists) { alert("Account exists for this role"); return; }
      const newAcc = { id: Date.now(), username, password, role };
      accounts.push(newAcc);
      localStorage.setItem("seva_accounts", JSON.stringify(accounts));
      // NEW: do NOT auto-login — show a message and redirect to login page
      alert("Signup successful. Please login to continue.");
      navigate("/login");
    } else {
      const match = accounts.find(a => a.username === username && a.password === password && a.role === role);
      if(!match){ alert("Invalid credentials"); return; }
      onAuth({ username, role });
    }
  }

  return (
    <div className="form-card">
      <h3>{mode === "signup" ? "Signup" : "Login"}</h3>
      <form onSubmit={handleSubmit}>
        <label>Role</label>
        <div className="role-row">
          <label><input type="radio" checked={role==="user"} onChange={()=>setRole("user")} /> User</label>
          <label><input type="radio" checked={role==="admin"} onChange={()=>setRole("admin")} /> Admin</label>
          <label><input type="radio" checked={role==="authority"} onChange={()=>setRole("authority")} /> Authority</label>
        </div>
        <label>Username</label>
        <input required value={username} onChange={e=>setUsername(e.target.value)} />
        <label>Password</label>
        <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {mode === "signup" && <>
          <label>Confirm Password</label>
          <input required type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
        </>}
        <div className="form-row">
          <button className="btn" type="submit">{mode === "signup" ? "Create account" : "Login"}</button>
          <button type="button" className="btn-outline" onClick={()=>navigate("/")}>Back</button>
        </div>
      </form>
    </div>
  );
}