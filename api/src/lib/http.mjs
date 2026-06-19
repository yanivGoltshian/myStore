// Shared helpers for the HTTP-triggered Functions.
import { isAdmin } from "./auth.mjs";

export function json(status, data) {
  return {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(data),
  };
}

// Returns an error response if the caller is not an admin, otherwise null.
export function requireAdmin(request) {
  if (!isAdmin(request)) {
    return json(403, { error: "Forbidden — admin role required." });
  }
  return null;
}

export async function readBody(request) {
  try {
    const text = await request.text();
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Invalid JSON body.");
  }
}
