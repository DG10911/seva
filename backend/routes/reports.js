// backend/routes/reports.js
import express from "express";
import { v4 as uuidv4 } from "uuid";
import { getReports, saveReports, getAuthorities } from "../utils/db.js";

const router = express.Router();

// Helper to persist and return
function allReports() {
  return getReports();
}

// GET /api/reports
router.get("/", (req, res) => {
  const list = allReports();
  res.json(list);
});

// GET /api/reports/:id
router.get("/:id", (req, res) => {
  const list = allReports();
  const r = list.find(x => x.id === req.params.id);
  if (!r) return res.status(404).json({ error: "Not found" });
  res.json(r);
});

// POST create
router.post("/", (req, res) => {
  const body = req.body;
  if (!body.title) return res.status(400).json({ error: "Missing title" });

  const list = allReports();
  const report = {
    id: uuidv4(),
    title: body.title,
    desc: body.desc || "",
    category: body.category || "general",
    area: body.area || "",
    pincode: body.pincode || "",
    lat: body.lat || null,
    lng: body.lng || null,
    votes: 0,
    completedVotes: 0,
    comments: [],
    status: "open",
    assignedTo: null,
    deadline: null,
    createdAt: new Date().toISOString(),
    createdBy: body.createdBy || null
  };

  // naive auto-assign by category -> authority id matching department substring
  const auths = getAuthorities();
  const matched = auths.find(a => a.department && a.department.toLowerCase().includes(report.category?.toLowerCase()));
  report.assignedTo = matched ? matched.id : (auths.length ? auths[0].id : null);

  list.unshift(report);
  saveReports(list);
  res.status(201).json(report);
});

// PATCH update partial
router.patch("/:id", (req, res) => {
  const id = req.params.id;
  const list = allReports();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const updated = { ...list[idx], ...req.body, updatedAt: new Date().toISOString() };
  list[idx] = updated;
  saveReports(list);
  res.json(updated);
});

// DELETE
router.delete("/:id", (req, res) => {
  const id = req.params.id;
  let list = allReports();
  const idx = list.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  list.splice(idx, 1);
  saveReports(list);
  res.status(204).send();
});

// POST vote
router.post("/:id/vote", (req, res) => {
  const id = req.params.id;
  const list = allReports();
  const r = list.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: "Not found" });
  r.votes = (r.votes || 0) + 1;
  saveReports(list);
  res.json(r);
});

// POST complete-vote (poll)
router.post("/:id/complete-vote", (req, res) => {
  const id = req.params.id;
  const list = allReports();
  const r = list.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: "Not found" });
  r.completedVotes = (r.completedVotes || 0) + 1;
  saveReports(list);
  res.json(r);
});

// POST comment
router.post("/:id/comment", (req, res) => {
  const id = req.params.id;
  const { author, text } = req.body;
  if (!text) return res.status(400).json({ error: "Missing comment text" });
  const list = allReports();
  const r = list.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: "Not found" });
  const comment = { id: uuidv4(), author: author || "anonymous", text, at: new Date().toISOString() };
  r.comments = r.comments || [];
  r.comments.push(comment);
  saveReports(list);
  res.json(comment);
});

// POST assign (admin/authority)
router.post("/:id/assign", (req, res) => {
  const id = req.params.id;
  const { authorityId } = req.body;
  if (!authorityId) return res.status(400).json({ error: "Missing authorityId" });
  const list = allReports();
  const r = list.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: "Not found" });

  r.assignedTo = authorityId;
  saveReports(list);
  res.json(r);
});

// POST set-deadline
router.post("/:id/deadline", (req, res) => {
  const id = req.params.id;
  const { deadline } = req.body;
  const list = allReports();
  const r = list.find(x => x.id === id);
  if (!r) return res.status(404).json({ error: "Not found" });
  r.deadline = deadline;
  saveReports(list);
  res.json(r);
});

export default router;