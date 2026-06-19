import { app } from "@azure/functions";
import { getBearerToken, adminEmails } from "../lib/auth.mjs";

// TEMPORARY diagnostic. Reveals NO secret values — only presence/length/counts,
// inbound header names, and (if a real token is supplied) the caller's own
// verified email. Unguessable route. Remove immediately after use.
app.http("authdiag7k2p9x", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "diag7k2p9x",
  handler: async (request) => {
    let headerNames = [];
    try {
      headerNames = Array.from(request.headers?.keys?.() || []);
    } catch {
      try {
        headerNames = Object.keys(request.headers || {});
      } catch {
        headerNames = [];
      }
    }
    const token = getBearerToken(request);
    const clientId = process.env.GOOGLE_CLIENT_ID || "";
    const out = {
      gotAuthHeader: !!token,
      bearerLen: token ? token.length : 0,
      headerNames,
      hasGoogleClientId: !!clientId,
      clientIdLen: clientId.length,
      adminEmailsCount: adminEmails().length,
      adminDev: process.env.ADMIN_DEV || null,
      nodeVersion: process.version,
      libLoads: null,
      verify: null,
    };
    try {
      await import("google-auth-library");
      out.libLoads = true;
    } catch (e) {
      out.libLoads = String(e && e.message ? e.message : e);
    }
    if (token && clientId) {
      try {
        const { OAuth2Client } = await import("google-auth-library");
        const client = new OAuth2Client(clientId);
        const ticket = await client.verifyIdToken({ idToken: token, audience: clientId });
        const p = ticket.getPayload();
        out.verify = {
          ok: true,
          email: p.email,
          email_verified: p.email_verified,
          allowed: adminEmails().includes(String(p.email).toLowerCase()),
          audMatches: p.aud === clientId,
        };
      } catch (e) {
        out.verify = { ok: false, error: String(e && e.message ? e.message : e) };
      }
    }
    return {
      status: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(out),
    };
  },
});
