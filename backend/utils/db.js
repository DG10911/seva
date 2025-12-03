// backend/utils/db.js
import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "db");

function readJSON(filename) {
  const p = path.join(DB_DIR, filename);
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw || "null") || [];
  } catch (err) {
    // If file missing, create empty
    fs.writeFileSync(p, JSON.stringify([] , null, 2));
    return [];
  }
}

function writeJSON(filename, data) {
  const p = path.join(DB_DIR, filename);
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

export function getUsers() {
  return readJSON("users.json");
}
export function saveUsers(u) {
  writeJSON("users.json", u);
}

export function getReports() {
  return readJSON("reports.json");
}
export function saveReports(r) {
  writeJSON("reports.json", r);
}

export function getAuthorities() {
  return readJSON("authorities.json");
}
export function saveAuthorities(a) {
  writeJSON("authorities.json", a);
}