import React from "react";

export default function ReportList({ reports = [], onView, onVote, onCompleteVote }){
  return (
    <div>
      <h3>Reports</h3>
      {reports.length === 0 && <p>No reports yet.</p>}
      <div className="list">
        {reports.map(r => (
          <div key={r.id || r.title} className="card small">
            <h4>{r.title}</h4>
            <p>{r.desc?.slice(0,120)}...</p>
            <p><b>Category:</b> {r.category} — <b>Area:</b> {r.area} ({r.pincode})</p>
            <p><b>Votes:</b> {r.votes || 0} | <b>Completed votes:</b> {r.completedVotes || 0}</p>
            <div className="row">
              <button className="btn" onClick={()=>onView(r)}>View</button>
              <button className="btn-outline" onClick={()=>onVote(r.id)}>Support</button>
              <button className="btn-outline" onClick={()=>onCompleteVote(r.id)}>Mark Completed (poll)</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}