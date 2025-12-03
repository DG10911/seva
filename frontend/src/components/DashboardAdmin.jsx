// src/components/DashboardAdmin.jsx
import React, { useEffect, useState } from "react";
import MapView from "./MapView";
import ReportView from "./ReportView";
import api from "../api/api";

export default function DashboardAdmin({ user }){
  const [reports, setReports] = useState([]);
  const [viewReport, setViewReport] = useState(null);

  useEffect(()=>{
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

  // helper to build marker objects with author and assignedName
  function buildMarkers(){
    const auths = (localStorage.getItem('seva_authorities') ? JSON.parse(localStorage.getItem('seva_authorities')) : []);
    const byId = {};
    for(const a of auths) byId[a.id] = a;

    return reports.filter(r => r.lat && r.lng).map(r => ({
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

  // Called when marker or its popup Open button is clicked
  function handleMarkerClick(markerObj){
    // find the linked report
    const r = reports.find(x => x.id === markerObj.id);
    if(r){
      setViewReport(r);
    } else {
      console.warn("Report not found for marker", markerObj);
    }
  }

  // Admin actions (assign, deadline, reply) — unchanged, but refresh after change
  async function setDeadlineFor(id){
    const newDeadline = prompt("Set deadline (ISO or text):", "");
    if(newDeadline == null) return;
    if(process.env.REACT_APP_API_BASE){
      try { await api.updateReport(id, { deadline: newDeadline }); refreshReports(); return; }
      catch(e){ console.warn(e); }
    }
    const arr = JSON.parse(localStorage.getItem('seva_reports') || '[]');
    const updated = arr.map(x => x.id === id ? { ...x, deadline: newDeadline } : x);
    localStorage.setItem('seva_reports', JSON.stringify(updated));
    refreshReports();
  }

  async function assignAuthority(id){
    const authorityId = prompt("Enter authority id to assign (e.g. sanitation-bettiah):", "");
    if(!authorityId) return;
    if(process.env.REACT_APP_API_BASE){
      try { await api.updateReport(id, { assignedTo: authorityId }); refreshReports(); return; }
      catch(e){ console.warn(e); }
    }
    const arr = JSON.parse(localStorage.getItem('seva_reports') || '[]');
    const updated = arr.map(x => x.id === id ? { ...x, assignedTo: authorityId } : x);
    localStorage.setItem('seva_reports', JSON.stringify(updated));
    refreshReports();
  }

  async function replyAsAdmin(id){
    const reply = prompt("Write admin reply (this will be shown as replied by Admin):");
    if(!reply) return;
    const comment = { author: `Admin (${user?.username||'admin'})`, text: reply, at: new Date().toISOString(), adminReply: true };
    if(process.env.REACT_APP_API_BASE){
      try { await api.commentReport(id, comment); refreshReports(); return; } catch(e){ console.warn(e); }
    }
    const arr = JSON.parse(localStorage.getItem('seva_reports') || '[]');
    const updated = arr.map(x => x.id === id ? { ...x, comments: [...(x.comments||[]), comment] } : x);
    localStorage.setItem('seva_reports', JSON.stringify(updated));
    refreshReports();
  }

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <p className="muted">Admin: see all reports, assign authorities, set deadlines and reply as verified.</p>

      <div style={{marginTop:12}} className="card">
        <h3>City Map — all live reports (Bettiah)</h3>
        <MapView
          markers={buildMarkers()}
          height="520px"
          onMarkerClick={handleMarkerClick}
        />
        <p className="muted" style={{marginTop:8}}>Click a marker, then press "Open" in the popup to view full report details and actions.</p>
      </div>

      <div style={{marginTop:18}} className="card">
        <h3>Reports (list)</h3>
        {reports.length === 0 && <p>No reports yet.</p>}
        {reports.map(r => (
          <div key={r.id} className="card small" style={{marginBottom:8}}>
            <h4>{r.title}</h4>
            <p>{r.desc?.slice(0,140)}{r.desc && r.desc.length>140 ? "..." : ""}</p>
            <p style={{margin:0}}><small><b>Area:</b> {r.area || "—"} | <b>Pincode:</b> {r.pincode || "—"}</small></p>
            <p style={{margin:0}}><small><b>Assigned:</b> {r.assignedTo || "—"} | <b>Deadline:</b> {r.deadline || "—"}</small></p>
            <div style={{display:'flex', gap:8, marginTop:8}}>
              <button className="btn" onClick={()=> setViewReport(r)}>Open</button>
              <button className="btn-outline" onClick={()=> setDeadlineFor(r.id)}>Set Deadline</button>
              <button className="btn-outline" onClick={()=> assignAuthority(r.id)}>Assign</button>
              <button className="btn-outline" onClick={()=> replyAsAdmin(r.id)}>Reply (Verified)</button>
            </div>
          </div>
        ))}
      </div>

      {viewReport && (
        <ReportView
          report={viewReport}
          onClose={()=> { setViewReport(null); refreshReports(); }}
          onComment={async (id, comment) => {
            // when comment posted inside ReportView, update backend/local and refresh
            if(process.env.REACT_APP_API_BASE){
              try { await api.commentReport(id, comment); refreshReports(); return; } catch(e){ console.warn(e); }
            }
            const arr = JSON.parse(localStorage.getItem('seva_reports') || '[]');
            const updated = arr.map(x => x.id === id ? { ...x, comments: [...(x.comments||[]), comment] } : x);
            localStorage.setItem('seva_reports', JSON.stringify(updated));
            refreshReports();
          }}
          user={user}
        />
      )}
    </div>
  );
}