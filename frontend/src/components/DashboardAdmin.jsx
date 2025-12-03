// src/components/DashboardAdmin.jsx
import React, { useEffect, useState } from "react";
import MapView from "./MapView";
import ReportView from "./ReportView";
import api from "../api/api";
import { jsPDF } from "jspdf";

export default function DashboardAdmin({ user }) {
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

  function buildMarkers() {
    const auths = localStorage.getItem("seva_authorities")
      ? JSON.parse(localStorage.getItem("seva_authorities"))
      : [];
    const byId = {};
    for (const a of auths) byId[a.id] = a;

    return reports
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

  async function setDeadlineFor(id) {
    const newDeadline = prompt("Set deadline (ISO or text):", "");
    if (newDeadline == null) return;
    if (process.env.REACT_APP_API_BASE) {
      try {
        await api.updateReport(id, { deadline: newDeadline });
        refreshReports();
        return;
      } catch (e) {
        console.warn(e);
      }
    }
    const arr = JSON.parse(localStorage.getItem("seva_reports") || "[]");
    const updated = arr.map((x) =>
      x.id === id ? { ...x, deadline: newDeadline } : x
    );
    localStorage.setItem("seva_reports", JSON.stringify(updated));
    refreshReports();
  }

  async function assignAuthority(id) {
    const authorityId = prompt(
      "Enter authority id to assign (e.g. sanitation-bettiah):",
      ""
    );
    if (!authorityId) return;
    if (process.env.REACT_APP_API_BASE) {
      try {
        await api.updateReport(id, { assignedTo: authorityId });
        refreshReports();
        return;
      } catch (e) {
        console.warn(e);
      }
    }
    const arr = JSON.parse(localStorage.getItem("seva_reports") || "[]");
    const updated = arr.map((x) =>
      x.id === id ? { ...x, assignedTo: authorityId } : x
    );
    localStorage.setItem("seva_reports", JSON.stringify(updated));
    refreshReports();
  }

  async function replyAsAdmin(id) {
    const reply = prompt(
      "Write admin reply (this will be shown as replied by Admin):"
    );
    if (!reply) return;
    const comment = {
      author: `Admin (${user?.username || "admin"})`,
      text: reply,
      at: new Date().toISOString(),
      adminReply: true,
    };
    if (process.env.REACT_APP_API_BASE) {
      try {
        await api.commentReport(id, comment);
        refreshReports();
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
    refreshReports();
  }

  // CSV export
  function downloadReportsCSV() {
    if (!reports.length) {
      alert("No reports to download.");
      return;
    }

    const header = [
      "id",
      "title",
      "description",
      "category",
      "area",
      "pincode",
      "status",
      "assignedTo",
      "deadline",
      "votes",
      "completedVotes",
      "createdBy",
      "createdAt",
      "lat",
      "lng",
    ];

    const rows = reports.map((r) => [
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
      r.lng ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((value) => {
            const v = String(value ?? "");
            if (v.includes(",") || v.includes('"') || v.includes("\n")) {
              return `"${v.replace(/"/g, '""')}"`;
            }
            return v;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.href = url;
    a.download = `seva_reports_admin_${ts}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // PDF export (all reports, 1 PDF, multiple pages)
  function downloadReportsPDF() {
    if (!reports.length) {
      alert("No reports to download.");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const lineHeight = 6;

    reports.forEach((r, idx) => {
      if (idx > 0) doc.addPage();
      let y = margin;

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Bettiah SEVA — Admin Report Summary", margin, y);
      y += lineHeight + 2;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      const lines = [
        `Report ID: ${r.id || idx + 1}`,
        `Title: ${r.title || ""}`,
        `Description: ${r.desc || ""}`,
        `Category: ${r.category || ""}    Status: ${r.status || ""}`,
        `Area: ${r.area || ""}    Pincode: ${r.pincode || ""}`,
        `Assigned To: ${r.assignedTo || "Not assigned"}`,
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
          "Use SEVA app / this link to see live route & ETA.",
          margin,
          y
        );
        doc.setTextColor(0);
      }

      doc.setFontSize(9);
      doc.text(
        `Exported by Admin: ${user?.username || "admin"} on ${new Date().toLocaleString()}`,
        margin,
        pageHeight - 8
      );
    });

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    doc.save(`bettiah-seva-admin-reports-${ts}.pdf`);
  }

  return (
    <div className="container">
      <h2>Admin Dashboard</h2>
      <p className="muted">
        Admin: see all reports, assign authorities, set deadlines and reply as
        verified.
      </p>

      {/* TOP RIGHT BUTTONS */}
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
        <button className="nav-btn" onClick={downloadReportsCSV}>
          Download all reports (CSV)
        </button>
        <button className="nav-btn" onClick={downloadReportsPDF}>
          Download all reports (PDF)
        </button>
      </div>

      <div style={{ marginTop: 12 }} className="card">
        <h3>City Map — all live reports (Bettiah)</h3>
        <MapView
          markers={buildMarkers()}
          height="520px"
          onMarkerClick={handleMarkerClick}
        />
        <p className="muted" style={{ marginTop: 8 }}>
          Click a marker, then press "Open" to view full report with map, route,
          ETA and single PDF.
        </p>
      </div>

      <div style={{ marginTop: 18 }} className="card">
        <h3>Reports (list)</h3>
        {reports.length === 0 && <p>No reports yet.</p>}
        {reports.map((r) => (
          <div key={r.id} className="card small" style={{ marginBottom: 8 }}>
            <h4>{r.title}</h4>
            <p>
              {r.desc?.slice(0, 140)}
              {r.desc && r.desc.length > 140 ? "..." : ""}
            </p>
            <p style={{ margin: 0 }}>
              <small>
                <b>Area:</b> {r.area || "—"} | <b>Pincode:</b>{" "}
                {r.pincode || "—"}
              </small>
            </p>
            <p style={{ margin: 0 }}>
              <small>
                <b>Assigned:</b> {r.assignedTo || "—"} | <b>Deadline:</b>{" "}
                {r.deadline || "—"}
              </small>
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <button className="btn" onClick={() => setViewReport(r)}>
                Open
              </button>
              <button
                className="btn-outline"
                onClick={() => setDeadlineFor(r.id)}
              >
                Set Deadline
              </button>
              <button
                className="btn-outline"
                onClick={() => assignAuthority(r.id)}
              >
                Assign
              </button>
              <button
                className="btn-outline"
                onClick={() => replyAsAdmin(r.id)}
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
          onComment={async (id, comment) => {
            if (process.env.REACT_APP_API_BASE) {
              try {
                await api.commentReport(id, comment);
                refreshReports();
                return;
              } catch (e) {
                console.warn(e);
              }
            }
            const arr = JSON.parse(
              localStorage.getItem("seva_reports") || "[]"
            );
            const updated = arr.map((x) =>
              x.id === id
                ? { ...x, comments: [...(x.comments || []), comment] }
                : x
            );
            localStorage.setItem("seva_reports", JSON.stringify(updated));
            refreshReports();
          }}
          user={user}
        />
      )}
    </div>
  );
}