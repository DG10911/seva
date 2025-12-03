// frontend/src/components/ReportForm.jsx
import React, { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import api from "../api/api";

const BettiahCenter = [26.8138, 84.5154];

function ClickMap({ marker, setMarker, onMarkerPlaced, draggable, setMarkerFromDrag }) {
  useMapEvents({
    click(e){
      const lat = Number(parseFloat(e.latlng.lat).toFixed(6));
      const lng = Number(parseFloat(e.latlng.lng).toFixed(6));
      setMarker([lat, lng]);
      if(onMarkerPlaced) onMarkerPlaced(lat, lng);
    }
  });

  return null;
}

/** choose best area (POI / house/road / neighbourhood / fallback to display_name parts) */
function buildPreciseArea(addr = {}, namedetails = {}, display_name = "") {
  const poiCandidates = [
    namedetails?.name,
    addr?.attraction,
    addr?.building,
    addr?.amenity,
    addr?.shop,
    addr?.leisure,
    addr?.office,
    addr?.tourism,
    addr?.historic,
    addr?.name
  ];
  for (const p of poiCandidates) if (p && p.length > 2) return p;

  if (addr.house_number && addr.road) return `${addr.house_number} ${addr.road}`;
  if (addr.road) return addr.road;

  const localityOrder = ["neighbourhood","suburb","residential","quarter","locality","village","town","city_district","city","county"];
  for (const k of localityOrder) if (addr[k]) return addr[k];

  if (display_name) {
    const parts = display_name.split(",").map(s=>s.trim()).filter(Boolean);
    return parts.slice(0,3).join(", ");
  }
  return "";
}

export default function ReportForm({ onSave }){
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("sanitation");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");
  const [marker, setMarker] = useState(null);
  const [searching, setSearching] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [alternatives, setAlternatives] = useState([]);

  const reverseGeocode = useCallback(async (lat, lon) => {
    setSearching(true);
    setResolvedAddress(null);
    setAlternatives([]);
    try {
      let json = null;
      const base = process.env.REACT_APP_API_BASE || "";

      // First: backend proxy with zoom parameter if available
      if (base) {
        try {
          const url = `${base.replace(/\/$/, "")}/geocode/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=18`;
          const resp = await fetch(url);
          if(resp.ok) json = await resp.json();
          else console.warn("backend geocode proxy returned", resp.status);
        } catch(e) {
          console.warn("backend geocode proxy failed", e);
        }
      }

      // fallback to Nominatim reverse with namedetails, zoom
      if (!json) {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1&namedetails=1&zoom=18`;
        const resp = await fetch(nomUrl, { headers: { "Accept-Language": "en" }});
        if(!resp.ok) throw new Error(`Nominatim reverse failed ${resp.status}`);
        json = await resp.json();
      }

      const addr = json.address || {};
      const nd = json.namedetails || {};
      const display = json.display_name || "";

      const best = buildPreciseArea(addr, nd, display);
      const postal = addr.postcode || addr.postal_code || "";

      if(best) setArea(best);
      if(postal) setPincode(postal);
      setResolvedAddress({ area: best || display, pincode: postal || "", display_name: display, raw: json });

      // Build alternatives from display_name segments (allow user to pick)
      if(display) {
        const parts = display.split(",").map(s=>s.trim()).filter(Boolean);
        // produce descending specificity lists: first 1 element, 2 elements joined, etc.
        const alt = [];
        for(let i=1;i<=Math.min(4, parts.length); i++){
          alt.push(parts.slice(0,i).join(", "));
        }
        setAlternatives([...new Set(alt)]);
      }
    } catch (err) {
      console.warn("reverseGeocode error", err);
    } finally {
      setSearching(false);
    }
  }, []);

  // geocode by query (area or pincode)
  const geocode = useCallback(async (q) => {
    if(!q) return;
    setSearching(true);
    setResolvedAddress(null);
    setAlternatives([]);
    try {
      const query = `${q} Bettiah`;
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&namedetails=1`);
      if(!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const arr = await resp.json();
      if(!arr || arr.length === 0){ alert("No results found"); setSearching(false); return; }
      const first = arr[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      setMarker([lat, lon]);
      await reverseGeocode(lat, lon);
    } catch (e){
      console.error(e);
      alert("Geocoding failed.");
    } finally { setSearching(false); }
  }, [reverseGeocode]);

  async function handleSubmit(e){
    e.preventDefault();
    if(!marker) { alert("Please place a marker on the map or search area/pincode first."); return; }
    const [lat, lng] = marker;
    const report = { title, desc, category, area, pincode, lat, lng, createdBy: (localStorage.getItem("seva_user") ? JSON.parse(localStorage.getItem("seva_user")).username : "anonymous") };

    if(process.env.REACT_APP_API_BASE){
      try {
        const saved = await api.createReport(report);
        onSave(saved);
        setTitle(""); setDesc(""); setArea(""); setPincode(""); setMarker(null); setResolvedAddress(null); setAlternatives([]);
        alert("Report submitted to server");
        return;
      } catch(err){
        console.warn("API create failed", err);
        alert("Failed to save to server, will save locally.");
      }
    }

    // local fallback
    const auths = JSON.parse(localStorage.getItem('seva_authorities') || '[]');
    let matched = auths.find(a => a.department && a.department.toLowerCase().includes(category));
    if(!matched && auths.length>0) matched = auths[0];
    report.assignedTo = matched ? matched.id : null;

    report.id = uuidv4();
    report.votes = 0; report.completedVotes = 0; report.comments = []; report.status = "open"; report.deadline = null; report.createdAt = new Date().toISOString();

    const arr = JSON.parse(localStorage.getItem('seva_reports') || '[]');
    arr.unshift(report);
    localStorage.setItem('seva_reports', JSON.stringify(arr));
    onSave(report);
    setTitle(""); setDesc(""); setArea(""); setPincode(""); setMarker(null); setResolvedAddress(null); setAlternatives([]);
    alert("Report saved locally");
  }

  // when marker is placed by click or dragend
  async function handleMarkerPlaced(lat, lng){
    await reverseGeocode(lat, lng);
  }

  // marker drag: update marker coords and re-run reverse geocode
  function DraggableMarker({ position, onDragEnd }) {
    // use a controlled marker that updates parent marker on drag end
    return position ? (
      <Marker
        position={position}
        draggable={true}
        eventHandlers={{
          dragend(e){
            const p = e.target.getLatLng();
            const lat = Number(p.lat.toFixed(6));
            const lng = Number(p.lng.toFixed(6));
            setMarker([lat, lng]);
            if(onDragEnd) onDragEnd(lat, lng);
          }
        }}
      />
    ) : null;
  }

  return (
    <div className="report-form-wrapper">
      <form onSubmit={handleSubmit} className="report-form">
        <label>Title</label>
        <input required value={title} onChange={e=>setTitle(e.target.value)} />
        <label>Description</label>
        <textarea required value={desc} onChange={e=>setDesc(e.target.value)} />
        <label>Category</label>
        <select value={category} onChange={e=>setCategory(e.target.value)}>
          <option value="sanitation">Sanitation</option>
          <option value="roads">Roads / PWD</option>
          <option value="police">Police / Safety</option>
          <option value="health">Health</option>
          <option value="fire">Fire & Rescue</option>
        </select>

        <label>Area / Locality</label>
        <input value={area} onChange={e=>setArea(e.target.value)} placeholder="Type area name and press Search"/>
        {resolvedAddress && (
          <div style={{background:'#f7f9fc', padding:8, borderRadius:6, marginTop:6}}>
            <small style={{color:'#333'}}><b>Resolved:</b> {resolvedAddress.area}</small><br/>
            <small style={{color:'#666'}}>{resolvedAddress.display_name}</small>
          </div>
        )}

        {alternatives.length > 0 && (
          <div style={{marginTop:8}}>
            <small>Suggestions: </small>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:6}}>
              {alternatives.map((a,i)=>(
                <button key={i} type="button" className="btn-outline" onClick={()=>{ setArea(a); }}>{a}</button>
              ))}
            </div>
          </div>
        )}

        <label>Pincode</label>
        <input value={pincode} onChange={e=>setPincode(e.target.value)} placeholder="e.g. 845438" />

        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button type="button" className="btn-outline" onClick={()=>geocode(area || pincode)} disabled={searching}>
            {searching ? "Searching..." : "Search area / pincode"}
          </button>
        </div>

        <div className="form-row" style={{marginTop:12}}>
          <button className="btn" type="submit">Submit Report (marker required)</button>
        </div>
      </form>

      <div className="report-map">
        <div className="map-container" style={{height:380}}>
          <MapContainer center={marker ? [marker[0], marker[1]] : BettiahCenter} zoom={15} style={{height:'100%', width:'100%'}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <ClickMap marker={marker} setMarker={setMarker} onMarkerPlaced={handleMarkerPlaced} />
            {/* draggable marker */}
            {marker && <DraggableMarker position={marker} onDragEnd={handleMarkerPlaced} />}
          </MapContainer>
        </div>
        <p className="muted" style={{marginTop:8}}>Click on the map to place a marker, then drag it to refine. Resolved address appears below. Submit only after confirming area/pincode.</p>
      </div>
    </div>
  );
}