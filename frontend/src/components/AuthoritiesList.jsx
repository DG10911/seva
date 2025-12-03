import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function AuthoritiesList(){
  const [list, setList] = useState([]);

  useEffect(() => {
    // Try load from backend, fallback to localStorage
    if(process.env.REACT_APP_API_BASE){
      api.getAuthorities().then(setList).catch(err=>{
        const raw = localStorage.getItem("seva_authorities");
        if(raw) setList(JSON.parse(raw));
      });
    } else {
      const raw = localStorage.getItem("seva_authorities");
      if(raw) setList(JSON.parse(raw));
    }
  }, []);

  return (
    <div className="container">
      <h2>Authorities — Bettiah</h2>
      <div className="grid">
        {list.map(a => (
          <div key={a.id} className="card">
            <img src={a.imageUrl || "/placeholder.png"} alt={a.name} className="thumb"/>
            <h4>{a.name}</h4>
            <p>{a.department}</p>
            <p>{a.city}, {a.state} ({a.pincode})</p>
            <p>Phone: {a.phone}</p>
            <p>Email: {a.email}</p>
            {a.wards && a.wards.length>0 && <details><summary>Wards</summary>
              <ul>{a.wards.map(w=> <li key={w.id}>{w.name} — {w.phone}</li>)}</ul>
            </details>}
          </div>
        ))}
        {list.length === 0 && <p>No authorities loaded. Paste the authorities JSON into localStorage key <code>seva_authorities</code> or start the backend.</p>}
      </div>
    </div>
  );
}