const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

async function post(path: string, body: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function getClasses() {
  return post("/get-classes", {});
}

export async function addUser(body: { name: string; surname: string; class_name: string }) {
  return post("/add-user", body);
}

export async function getCandidates() {
  return post("/get-candidates", {});
}

export async function voteCandidate(body: any) {
  return post("/vote", body);
}

export async function unvoteUser(body: any) {
  return post("/unvote", body);
}

export async function whoAmIVoting(body: any) {
  return post("/who-am-i-voting", body);
}

export async function isCandidate(body: any) {
  return post("/is-candidate", body);
}

export async function addCandidate(body: any) {
  return post("/add-candidate", body);
}

export async function removeCandidate(body: any) {
  return post("/remove-candidate", body);
}

export async function getStats() {
  return post("/get-stats", {});
}
