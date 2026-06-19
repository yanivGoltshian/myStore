// Authorization helper for Static Web Apps. SWA already gates /api/* to the
// "admin" role via staticwebapp.config.json; this is defense-in-depth and also
// lets the local harness bypass auth by setting ADMIN_DEV=1.
export function getPrincipal(request) {
  let raw;
  try {
    raw = request.headers?.get?.("x-ms-client-principal");
  } catch {
    raw = undefined;
  }
  if (!raw && request.headers && typeof request.headers === "object") {
    raw = request.headers["x-ms-client-principal"];
  }
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export function isAdmin(request) {
  if (process.env.ADMIN_DEV === "1") return true;
  const p = getPrincipal(request);
  return !!(p && Array.isArray(p.userRoles) && p.userRoles.includes("admin"));
}
