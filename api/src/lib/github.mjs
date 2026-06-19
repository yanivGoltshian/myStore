// GitHub backend — used in production. Persists content by committing JSON and
// images straight to the repo via the GitHub Contents API. Each commit triggers
// the Static Web Apps GitHub Action, which rebuilds and republishes the site.
// No database, no blob storage => $0 persistence.
//
// Required app settings (env vars):
//   GITHUB_TOKEN  - PAT (classic: repo scope, or fine-grained: Contents read/write)
//   GITHUB_REPO   - "owner/repo", e.g. "yanivGoltshian/myStore"
//   GITHUB_BRANCH - branch to commit to (default "main")
const API = "https://api.github.com";

function repo() {
  const r = process.env.GITHUB_REPO;
  if (!r) throw new Error("GITHUB_REPO app setting is not configured.");
  return r;
}
function branch() {
  return process.env.GITHUB_BRANCH || "main";
}
function headers() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error("GITHUB_TOKEN app setting is not configured.");
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "electrohankin-admin",
  };
}

async function getMeta(p) {
  const r = await fetch(
    `${API}/repos/${repo()}/contents/${p}?ref=${encodeURIComponent(branch())}`,
    { headers: headers() }
  );
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub read ${p}: ${r.status} ${await r.text()}`);
  return r.json();
}

async function put(p, contentB64, message) {
  const meta = await getMeta(p);
  const body = { message, content: contentB64, branch: branch() };
  if (meta && meta.sha) body.sha = meta.sha;
  const r = await fetch(`${API}/repos/${repo()}/contents/${p}`, {
    method: "PUT",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`GitHub write ${p}: ${r.status} ${await r.text()}`);
  return r.json();
}

export async function readJSON(p) {
  const meta = await getMeta(p);
  if (!meta) throw new Error(`Not found in repo: ${p}`);
  const buf = Buffer.from(meta.content, meta.encoding === "base64" ? "base64" : "utf8");
  return JSON.parse(buf.toString("utf8"));
}

export async function exists(p) {
  return (await getMeta(p)) !== null;
}

export async function writeJSON(p, data, message) {
  const b64 = Buffer.from(JSON.stringify(data, null, 2) + "\n", "utf8").toString("base64");
  return put(p, b64, message || `admin: update ${p}`);
}

export async function writeBinary(p, buffer, message) {
  const b64 = Buffer.from(buffer).toString("base64");
  return put(p, b64, message || `admin: upload ${p}`);
}

export async function deleteFile(p, message) {
  const meta = await getMeta(p);
  if (!meta) return { ok: true };
  const r = await fetch(`${API}/repos/${repo()}/contents/${p}`, {
    method: "DELETE",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: message || `admin: delete ${p}`,
      sha: meta.sha,
      branch: branch(),
    }),
  });
  if (!r.ok) throw new Error(`GitHub delete ${p}: ${r.status} ${await r.text()}`);
  return r.json();
}
