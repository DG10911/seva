// frontend/src/components/MapView.jsx
import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const BettiahCenter = [26.8138, 84.5154];

export default function MapView({ markers = [], height = "500px", route = null, onMarkerClick }) {
  // route: GeoJSON feature (with geometry.coordinates [ [lon,lat],... ])
  const polylinePositions = route && route.geometry ? route.geometry.coordinates.map(c => [c[1], c[0]]) : null;

  return (
    <div className="map-container" style={{ height }}>
      <MapContainer center={BettiahCenter} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markers.map(m => (
          <Marker key={m.id} position={[m.lat, m.lng]} eventHandlers={{
            click: () => { if(onMarkerClick) onMarkerClick(m); }
          }}>
            <Popup>
              <div style={{maxWidth:280}}>
                <strong>{m.title}</strong>
                {m.desc && <p style={{margin:'6px 0'}}>{m.desc.length>140 ? m.desc.slice(0,140)+"..." : m.desc}</p>}
                <p style={{margin:0}}><small><b>Author:</b> {m.author || "unknown"}</small></p>
                <p style={{margin:0}}><small><b>Assigned:</b> {m.assignedName || m.assignedTo || "—"}</small></p>
                <div style={{marginTop:8}}>
                  <button className="btn" onClick={(e)=>{ e.stopPropagation(); if(onMarkerClick) onMarkerClick(m); }}>Open</button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {polylinePositions && (
          <>
            {/* start marker */}
            <Marker position={polylinePositions[0]}>
              <Popup><small>Start</small></Popup>
            </Marker>
            {/* end marker */}
            <Marker position={polylinePositions[polylinePositions.length - 1]}>
              <Popup><small>Destination</small></Popup>
            </Marker>

            {/* green dotted line */}
            <Polyline
              positions={polylinePositions}
              pathOptions={{
                color: "#2ecc71",
                weight: 5,
                dashArray: "8 6",
                opacity: 0.9
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}