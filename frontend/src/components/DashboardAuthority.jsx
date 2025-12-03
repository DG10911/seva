// src/components/DashboardAuthority.jsx
import React, { useEffect, useState } from "react";
import MapView from "./MapView";
import ReportView from "./ReportView";
import api from "../api/api";

/**
 * Authority dashboard: shows only reports assigned to the logged-in authority
 * - Click marker or Open in popup to view the report
 * - Authority can reply (their replies are flagged as byAuthority: true)
 * - NEW: Download my reports (CSV)
 */
export default function DashboardAuthority({ user }) {
  const [reports, setReports] = useState([]);
  const [viewReport, setViewReport] = useState(null);

  useEffect(() => {
    refreshReports();
  }, []);

  async function refreshReports(){
    if(process.env.REACT_APP_API_BASE){
      try {
        const res = await api.getReports();
        setReports(res);
        return;
      } catch(err){
        console.warn("API getReports failed", err);
      }
    }
    setReports(JSON.parse(localStorage.getItem('seva_reports') || '[]'));
  }

  // only show reports assigned to this authority (username should be authority id)
  function myAssignedReports() {
    const myId = user?.username;
    return (reports || []).filter(r => r.assignedTo === myId);
  }

  // build markers including author/assignedName for popups
  function buildMarkers() {
    const auths = (localStorage.getItem('seva_authorities') ? JSON.parse(localStorage.getItem('seva_authorities')) : []);
    const byId = {};
    for(const a of auths) byId[a.id] = a;
    return myAssignedReports()
      .filter(r => r.lat && r.lng)
      .map(r => ({
        id: r.id,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
        title: r.title,
        desc: r.desc,
        author: r.createdBy || r.author || "anonymous",
        assignedTo: r.assignedTo,
        assignedName: r.assignedTo ? (byId[r.assignedTo]?.name || r.assignedTo) : "Not assigned"
      }));
  }

  // marker click -> open ReportView with that report
  function handleMarkerClick(markerObj){
    const r = reports.find(x => x.id === markerObj.id);
    if(r) setViewReport(r);
    else console.warn("Report for marker not found", markerObj);
  }

  // Authority quick reply
  async function replyAsAuthority(id){
    const text = prompt("Write your reply (this will be shown as replied by Authority):");
    if(!text) return;
    const comment = { author: `Authority (${user?.username || 'authority'})`, text, at: new Date().toISOString(), byAuthority: true };
    if(process.env.REACT_APP_API_BASE){
      try { await api.commentReport(id, comment); await refreshReports(); return; } catch(e){ console.warn(e); }
    }
    const arr = JSON.parse(localStorage.getItem('seva_reports')||'[]');
    const updated = arr.map(x => x.id === id ? { ...x, comments: [...(x.comments||[]), comment] } : x);
    localStorage.setItem('seva_reports', JSON.stringify(updated));
    await refreshReports();
  }

  async function onCommentHandler(id, comment){
    await refreshReports();
  }

  // 🔽 NEW: Download only my assigned reports as CSV
  function downloadMyReportsCSV() {
    const myReports = myAssignedReports();
    if (!myReports.length) {
      alert("No reports assigned to you to download.");
      return;
    }

    const header = [
      "id","title","description","category","area","pincode",
      "status","assignedTo","deadline","votes","completedVotes",
      "createdBy","createdAt","lat","lng"
    ];

    const rows = myReports.map(r => [
      r.id || "",
      (r.title || "").replace(/\n/g, " "),
      (r.desc || "").replace(/\n/g, " "),
      r.category || "",
      r.area || "",
      r.pincode || "",
      r.status || "",
      r.assignedTo || "",
      r.deadline || "",
      r.votes ?? "",
      r.completedVotes ?? "",
      r.createdBy || "",
      r.createdAt || "",
      r.lat ?? "",
      r.lng ?? ""
    ]);

    const csv = [header, ...rows]
      .map(row => row
        .map(value => {
          const v = String(value ?? "");
          if (v.includes(",") || v.includes("\"") || v.includes("\n")) {
            return `"${v.replace(/"/g, '""')}"`;
          }
          return v;
        })
        .join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `seva_reports_${user?.username || "authority"}_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="container">
      <h2>Authority Dashboard</h2>
      <p className="muted">Logged in as <b>{user?.username}</b> — showing reports assigned to your authority.</p>

      <div style={{display:"flex", justifyContent:"flex-end", marginTop:8, marginBottom:8}}>
        <button className="btn-outline" onClick={downloadMyReportsCSV}>
          Download my reports (CSV)
        </button>
      </div>

      <div className="card" style={{marginTop:12}}>
        <h3>Map — reports assigned to you</h3>
        <MapView
          markers={buildMarkers()}
          height="520px"
          onMarkerClick={handleMarkerClick}
        />
        <p className="muted" style={{marginTop:8}}>Click a marker and press Open to view details. You can reply from the report view or use the Reply button below.</p>
      </div>

      <div className="card" style={{marginTop:12}}>
        <h3>Your Assigned Reports (list)</h3>
        {myAssignedReports().length === 0 && <p>No reports currently assigned to you.</p>}
        {myAssignedReports().map(r => (
          <div key={r.id} className="card small" style={{marginBottom:8}}>
            <h4>{r.title}</h4>
            <p style={{margin:0}}>{r.desc?.slice(0,120)}{r.desc && r.desc.length>120 ? "..." : ""}</p>
            <p style={{margin:0}}><small><b>Area:</b> {r.area || "—"} | <b>Pincode:</b> {r.pincode || "—"}</small></p>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button className="btn" onClick={()=> setViewReport(r)}>Open</button>
              <button className="btn-outline" onClick={()=> replyAsAuthority(r.id)}>Reply (Verified)</button>
            </div>
          </div>
        ))}
      </div>

      {viewReport && (
        <ReportView
          report={viewReport}
          onClose={() => { setViewReport(null); refreshReports(); }}
          onComment={onCommentHandler}
          user={user}
        />
      )}
    </div>
  );
}