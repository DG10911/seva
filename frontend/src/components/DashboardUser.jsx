// src/components/DashboardUser.jsx
import React, { useEffect, useState } from "react";
import ReportForm from "./ReportForm";
import ReportList from "./ReportList";
import ReportView from "./ReportView";
import MapView from "./MapView";
import api from "../api/api";

export default function DashboardUser({ user }){
  const [reports, setReports] = useState([]);
  const [mode, setMode] = useState(null);
  const [viewReport, setViewReport] = useState(null);

  useEffect(()=> {
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
    setReports(JSON.parse(localStorage.getItem('seva_reports')||'[]'));
  }

  function handleNewReportSaved(r){
    refreshReports();
    setMode(null);
  }

  function handleView(r){ setViewReport(r); }
  function closeView(){ setViewReport(null); }

  async function handleVote(id){
    if(process.env.REACT_APP_API_BASE){
      await api.voteReport(id).catch(()=>{});
      await refreshReports();
      return;
    }
    const arr = reports.map(r => r.id === id ? {...r, votes: (r.votes||0)+1 } : r);
    localStorage.setItem('seva_reports', JSON.stringify(arr));
    setReports(arr);
  }

  async function handleCompleteVote(id){
    if(process.env.REACT_APP_API_BASE){
      await api.completeVoteReport(id).catch(()=>{});
      await refreshReports();
      return;
    }
    const arr = reports.map(r => r.id === id ? {...r, completedVotes: (r.completedVotes||0)+1 } : r);
    localStorage.setItem('seva_reports', JSON.stringify(arr));
    setReports(arr);
  }

  async function handleComment(id, comment){
    if(process.env.REACT_APP_API_BASE){
      await api.commentReport(id, comment).catch(()=>{});
      await refreshReports();
      return;
    }
    const arr = reports.map(r => r.id === id ? {...r, comments:[...(r.comments||[]), comment]} : r);
    localStorage.setItem('seva_reports', JSON.stringify(arr));
    setReports(arr);
  }

  // build marker objects including assignedName and author
  function buildMarkers() {
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

  return (
    <div className="container">
      <h2>User Dashboard</h2>
      <p className="muted">Welcome {user?.username || "User"}</p>

      <div style={{display:'flex', gap:16, marginBottom:18}}>
        <button className="btn" style={{padding:'16px 24px'}} onClick={()=>setMode("submit")}>Submit New Report</button>
        <button className="btn-outline" style={{padding:'16px 24px'}} onClick={()=>setMode("browse")}>Browse Reports</button>
      </div>

      {mode === "submit" && (
        <div className="card">
          <h3>Submit New Report</h3>
          <ReportForm onSave={handleNewReportSaved} />
        </div>
      )}

      {mode === "browse" && (
        <div className="card">
          <h3>All Reports</h3>
          <ReportList reports={reports} onView={handleView} onVote={handleVote} onCompleteVote={handleCompleteVote} />
        </div>
      )}

      <div style={{marginTop:18}}>
        <h3>Map — reports with location</h3>
        <MapView
          markers={buildMarkers()}
          height="450px"
          onMarkerClick={(m)=> {
            // find report by id and open it
            const r = reports.find(x => x.id === m.id);
            if(r) setViewReport(r);
          }}
        />
      </div>

      {viewReport && <ReportView report={viewReport} onClose={closeView} onComment={handleComment} user={user} />}
    </div>
  );
}