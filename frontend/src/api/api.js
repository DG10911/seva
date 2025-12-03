// src/api/api.js
const BASE = process.env.REACT_APP_API_BASE || "";

async function request(path, opts = {}) {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...opts.headers,
    },
    ...opts,
  });
  if (!res.ok) {
    const text = await res.text().catch(()=>"");
    let err = new Error(`API error ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(()=>null);
  return data;
}

/* AUTH */
export async function login({ username, password, role }) {
  return request(`/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username, password, role })
  });
}
export async function signup({ username, password, role }) {
  return request(`/auth/signup`, {
    method: "POST",
    body: JSON.stringify({ username, password, role })
  });
}

/* AUTHORITIES */
export async function getAuthorities() {
  return request(`/authorities`);
}
export async function getAuthorityById(id){
  return request(`/authorities/${encodeURIComponent(id)}`);
}

/* REPORTS */
export async function getReports() {
  return request(`/reports`);
}
export async function getReport(id){
  return request(`/reports/${encodeURIComponent(id)}`);
}
export async function createReport(report) {
  return request(`/reports`, { method: "POST", body: JSON.stringify(report) });
}
export async function updateReport(id, patch) {
  return request(`/reports/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
}
export async function deleteReport(id){
  return request(`/reports/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/* VOTES & COMMENTS (server endpoints) */
export async function voteReport(id){
  return request(`/reports/${encodeURIComponent(id)}/vote`, { method: "POST" });
}
export async function completeVoteReport(id){
  return request(`/reports/${encodeURIComponent(id)}/complete-vote`, { method: "POST" });
}
export async function commentReport(id, comment){
  return request(`/reports/${encodeURIComponent(id)}/comment`, { method: "POST", body: JSON.stringify(comment) });
}

/* ADMIN: user & authority management (if backend implements) */
export async function getUsers(){
  return request(`/users`);
}
export async function updateUser(id, patch){
  return request(`/users/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
}
export async function getOnlineUsers(){
  return request(`/users/online`);
}

/* ORS proxy (optional) */
export async function getRouteGeoJSON(coordinates, profile = "driving-car") {
  return request(`/ors/route`, { method: "POST", body: JSON.stringify({ coordinates, profile }) });
}

export default {
  login, signup, getAuthorities, getReports, getReport, createReport, updateReport,
  voteReport, completeVoteReport, commentReport, getUsers, updateUser, getOnlineUsers, getRouteGeoJSON
};