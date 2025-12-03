// src/components/ReportView.jsx
import React, { useEffect, useState } from "react";
import MapView from "./MapView";
import api from "../api/api";

function VerifiedBadge({ text }) {
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:6, background:'#e6ffed', color:'#0b7a3a', padding:'2px 8px', borderRadius:12, fontSize:12, marginLeft:8}}>
      <strong>✓</strong> <span style={{fontWeight:600}}>{text || "Verified"}</span>
    </span>
  );
}

export default function ReportView({ report, onClose, onComment, user }){
  const [commentText, setCommentText] = useState("");
  const [route, setRoute] = useState(null);
  const [etaInfo, setEtaInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [assignedName, setAssignedName] = useState(report.assignedTo || null);

  useEffect(()=>{
    async function fetchAssigned(){
      if(!report.assignedTo) return;
      if(process.env.REACT_APP_API_BASE){
        try {
          const a = await api.getAuthorityById(report.assignedTo);
          if(a && a.name) setAssignedName(a.name);
          return;
        } catch(e){}
      }
      const auths = JSON.parse(localStorage.getItem('seva_authorities') || '[]');
      const found = auths.find(x=>x.id === report.assignedTo);
      if(found) setAssignedName(found.name);
    }
    fetchAssigned();
  }, [report.assignedTo]);

  async function calcETA(){
    if(!report.lat || !report.lng){ alert("Report has no coordinates"); return; }
    if(!navigator.geolocation){ alert("Geolocation not available"); return; }

    navigator.geolocation.getCurrentPosition(async pos => {
      setLoadingRoute(true);
      const start = [pos.coords.longitude, pos.coords.latitude];
      const end = [parseFloat(report.lng), parseFloat(report.lat)];

      if(process.env.REACT_APP_API_BASE){
        try {
          const data = await api.getRouteGeoJSON([start, end], "driving-car");
          if(!data || !data.features || data.features.length === 0) throw new Error("No route");
          const feat = data.features[0];
          setRoute(feat);
          setEtaInfo(feat.properties?.summary || null);
          setLoadingRoute(false);
          return;
        } catch(err){
          console.warn("Backend ORS proxy failed:", err);
        }
      }

      if(process.env.REACT_APP_ORS_KEY){
        try {
          const resp = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
            method: "POST",
            headers: {"Authorization": process.env.REACT_APP_ORS_KEY, "Content-Type":"application/json"},
            body: JSON.stringify({ coordinates: [start, end] })
          });
          if(!resp.ok) throw new Error(`ORS HTTP ${resp.status}`);
          const data = await resp.json();
          const feat = data.features?.[0];
          setRoute(feat);
          setEtaInfo(feat.properties?.summary || null);
          setLoadingRoute(false);
          return;
        } catch(e){
          console.error("Direct ORS call failed:", e);
        }
      }

      // fallback: haversine estimate
      const haversine = (a,b) => {
        const R = 6371;
        const toRad = x => x * Math.PI / 180;
        const dLat = toRad(b[1]-a[1]);
        const dLon = toRad(b[0]-a[0]);
        const lat1 = toRad(a[1]); const lat2 = toRad(b[1]);
        const sinDLat = Math.sin(dLat/2); const sinDLon = Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLon*sinDLon), Math.sqrt(1 - (sinDLat*sinDLat + Math.cos(lat1)*Math.cos(lat2)*sinDLon*sinDLon)));
        return R * c;
      };
      const distKm = haversine(start, end);
      const avgSpeedKmh = 30;
      const estMin = Math.round((distKm / avgSpeedKmh) * 60);
      setEtaInfo({ distance: Math.round(distKm*1000), duration: estMin*60 });
      setLoadingRoute(false);
      alert("Precise route not available — showing straight-line ETA estimate.");
    }, err => { alert("Allow location to calculate ETA"); });
  }

  // post comment: if authority user posts, flag comment.byAuthority = true
  function handleCommentPost(){
    if(!commentText.trim()) return;
    const isAuthorityUser = user?.role === "authority";
    const authorName = user?.name || user?.username || "authority";
    const comment = {
      author: isAuthorityUser ? `Authority (${authorName})` : (user?.name || user?.username || "anonymous"),
      text: commentText.trim(),
      at: new Date().toISOString(),
      byAuthority: !!isAuthorityUser
    };

    if(process.env.REACT_APP_API_BASE){
      api.commentReport(report.id, comment).then(()=> {
        onComment(report.id, comment);
      }).catch(()=> {
        onComment(report.id, comment);
      });
    } else {
      // local fallback
      const arr = JSON.parse(localStorage.getItem('seva_reports') || '[]');
      const updated = arr.map(r => r.id === report.id ? { ...r, comments: [...(r.comments||[]), comment] } : r);
      localStorage.setItem('seva_reports', JSON.stringify(updated));
      onComment(report.id, comment);
    }
    setCommentText("");
  }

  const googleNav = report.lat && report.lng ? `https://www.google.com/maps/dir/?api=1&destination=${report.lat},${report.lng}&travelmode=driving` : "https://www.google.com/maps";

  return (
    <div className="report-view card" style={{position:'relative'}}>
      <button className="close" onClick={onClose}>X</button>

      <h3 style={{display:'flex', alignItems:'center', gap:12}}>
        {report.title}
        {report.assignedTo && <small style={{color:'#666'}}>({report.assignedTo})</small>}
      </h3>

      <p>{report.desc}</p>
      <p><b>Area:</b> {report.area} | <b>Pincode:</b> {report.pincode}</p>
      <p><b>Author:</b> {report.createdBy || "anonymous"} | <b>Assigned to:</b> {assignedName || (report.assignedTo || "Not assigned")}</p>

      <div style={{display:'flex', gap:8, marginTop:8}}>
        <button className="btn" onClick={calcETA} disabled={loadingRoute}>{loadingRoute ? "Calculating..." : "Calculate ETA & Route"}</button>
        <a className="btn-outline" href={googleNav} target="_blank" rel="noreferrer">Open in Google Maps</a>
      </div>

      {etaInfo && (
        <div style={{marginTop:8}}>
          <p><b>Estimated travel:</b> {(etaInfo.distance/1000).toFixed(2)} km — {(etaInfo.duration/60).toFixed(0)} min</p>
        </div>
      )}

      <div style={{marginTop:12}}>
        <MapView markers={[{id:report.id, lat:parseFloat(report.lat), lng:parseFloat(report.lng), title:report.title, desc:report.desc, author: report.createdBy, assignedTo: report.assignedTo, assignedName }]} height="300px" route={route} />
      </div>

      <div style={{marginTop:12}}>
        <h4>Comments</h4>
        {report.comments?.length ? report.comments.map((c, idx) =>
          <div key={c.id || c.at || idx} className="comment" style={{borderLeft: (c.byAuthority || c.adminReply) ? "3px solid #2ecc71" : "3px solid transparent", paddingLeft:8, marginBottom:8}}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <b>{c.author}</b>
              <small style={{color:'#666'}}>{new Date(c.at).toLocaleString()}</small>
              {(c.byAuthority || c.adminReply) && <VerifiedBadge text={ c.byAuthority ? "Authority" : "Verified" } />}
            </div>
            <p style={{marginTop:6}}>{c.text}</p>
          </div>
        ) : <p>No comments yet</p>}

        <div style={{display:'flex', gap:8, marginTop:8}}>
          <input placeholder="Write a comment..." value={commentText} onChange={e=>setCommentText(e.target.value)} />
          <button className="btn" onClick={handleCommentPost}>Post</button>
        </div>
      </div>
    </div>
  );
}