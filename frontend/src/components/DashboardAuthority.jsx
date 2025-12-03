// src/components/DashboardAuthority.jsx
import React, { useEffect, useState } from "react";
import MapView from "./MapView";
import ReportView from "./ReportView";
import api from "../api/api";
import { jsPDF } from "jspdf";

export default function DashboardAuthority({ user }) {
  const [reports, setReports] = useState([]);
  const [viewReport, setViewReport] = useState(null);

  useEffect(() => {
    refreshReports();
  }, []);

  async function refreshReports() {
    if (process.env.REACT_APP_API_BASE) {
      try {
        const res = await api.getReports();
        setReports(res);
        return;
      } catch (err) {
        console.warn("API getReports failed", err);
      }
    }
    setReports(JSON.parse(localStorage.getItem("seva_reports") || "[]"));
  }

  function myAssignedReports() {
    const myId = user?.username;
    return (reports || []).filter((r) => r.assignedTo === myId);
  }

  function buildMarkers() {
    const auths = localStorage.getItem("seva_authorities")
      ? JSON.parse(localStorage.getItem("seva_authorities"))
      : [];
    const byId = {};
    for (const a of auths) byId[a.id] = a;

    return myAssignedReports()
      .filter((r) => r.lat && r.lng)
      .map((r) => ({
        id: r.id,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lng),
        title: r.title,
        desc: r.desc,
        author: r.createdBy || r.author || "anonymous",
        assignedTo: r.assignedTo,
        assignedName: r.assignedTo
          ? byId[r.assignedTo]?.name || r.assignedTo
          : "Not assigned",
      }));
  }

  function handleMarkerClick(markerObj) {
    const r = reports.find((x) => x.id === markerObj.id);
    if (r) setViewReport(r);
  }

  async function replyAsAuthority(id) {
    const text = prompt(
      "Write your reply (this will be shown as replied by Authority):"
    );
    if (!text) return;
    const comment = {
      author: `Authority (${user?.username || "authority"})`,
      text,
      at: new Date().toISOString(),
      byAuthority: true,
    };
    if (process.env.REACT_APP_API_BASE) {
      try {
        await api.commentReport(id, comment);
        await refreshReports();
        return;
      } catch (e) {
        console.warn(e);
      }
    }
    const arr = JSON.parse(localStorage.getItem("seva_reports") || "[]");
    const updated = arr.map((x) =>
      x.id === id
        ? { ...x, comments: [...(x.comments || []), comment] }
        : x
    );
    localStorage.setItem("seva_reports", JSON.stringify(updated));
    await refreshReports();
  }

  async function onCommentHandler() {
    await refreshReports();
  }

  // 🔥 NEW: bulk PDF with Authority verification
  function downloadMyReportsPDF() {
    const myReports = myAssignedReports();
    if (!myReports.length) {
      alert("No reports assigned to you to download.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const lineHeight = 6;

    myReports.forEach((r, idx) => {
      if (idx > 0) doc.addPage();
      let y = margin;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Bettiah SEVA — Authority Report Summary", margin, y);
      y += lineHeight + 2;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const lines = [
        `Assigned Authority: ${user?.username || "Authority"}`,
        `Report ID: ${r.id || idx + 1}`,
        `Title: ${r.title || ""}`,
        `Description: ${r.desc || ""}`,
        `Category: ${r.category || ""}    Status: ${r.status || ""}`,
        `Area: ${r.area || ""}    Pincode: ${r.pincode || ""}`,
        `Deadline: ${r.deadline || "—"}`,
        `Votes: ${r.votes ?? 0}    Completed Votes: ${r.completedVotes ?? 0}`,
        `Created By: ${r.createdBy || "anonymous"}    At: ${
          r.createdAt || ""
        }`,
      ];

      for (const line of lines) {
        const wrapped = doc.splitTextToSize(
          line,
          pageWidth - margin * 2
        );
        doc.text(wrapped, margin, y);
        y += lineHeight * wrapped.length;
      }

      if (r.lat && r.lng) {
        y += lineHeight;
        const locLine = `Location: ${r.lat}, ${r.lng}`;
        doc.text(
          doc.splitTextToSize(locLine, pageWidth - 2 * margin),
          margin,
          y
        );
        y += lineHeight;

        const mapLine = `Google Maps: https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}&travelmode=driving`;
        doc.text(
          doc.splitTextToSize(mapLine, pageWidth - 2 * margin),
          margin,
          y
        );
        y += lineHeight * 2;

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(
          "For live route & ETA, use SEVA app or this link.",
          margin,
          y
        );
        doc.setTextColor(0);
      }

      // Authority verification stamp
      y += lineHeight * 2;
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(
        `✔ Verified by Authority: ${user?.username || "Authority"}`,
        margin,
        y
      );
      y += lineHeight * 2;

      doc.setFontSize(9);
      doc.text(
        `Exported on ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 8
      );
    });

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    doc.save(`bettiah-seva-authority-${user?.username || "reports"}-${ts}.pdf`);
  }

  return (
    <div className="container">
      <h2>Authority Dashboard</h2>
      <p className="muted">
        Logged in as <b>{user?.username}</b> — showing reports assigned to your
        authority.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 8,
          marginTop: 8,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <button className="btn-outline" onClick={downloadMyReportsPDF}>
          Download my reports (PDF)
        </button>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Map — reports assigned to you</h3>
        <MapView
          markers={buildMarkers()}
          height="520px"
          onMarkerClick={handleMarkerClick}
        />
        <p className="muted" style={{ marginTop: 8 }}>
          Click a marker and press Open to view full details with map, route,
          ETA and individual PDF download.
        </p>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>Your Assigned Reports (list)</h3>
        {myAssignedReports().length === 0 && (
          <p>No reports currently assigned to you.</p>
        )}
        {myAssignedReports().map((r) => (
          <div key={r.id} className="card small" style={{ marginBottom: 8 }}>
            <h4>{r.title}</h4>
            <p style={{ margin: 0 }}>
              {r.desc?.slice(0, 120)}
              {r.desc && r.desc.length > 120 ? "..." : ""}
            </p>
            <p style={{ margin: 0 }}>
              <small>
                <b>Area:</b> {r.area || "—"} | <b>Pincode:</b>{" "}
                {r.pincode || "—"}
              </small>
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn" onClick={() => setViewReport(r)}>
                Open
              </button>
              <button
                className="btn-outline"
                onClick={() => replyAsAuthority(r.id)}
              >
                Reply (Verified)
              </button>
            </div>
          </div>
        ))}
      </div>

      {viewReport && (
        <ReportView
          report={viewReport}
          onClose={() => {
            setViewReport(null);
            refreshReports();
          }}
          onComment={onCommentHandler}
          user={user}
        />
      )}
    </div>
  );
}