// Build-time gating + endpoint for the newsletter signup. Mirrors
// src/lib/coupons.ts: a committed JSON file is the master on/off switch, read at
// build time and baked into the bundle. When OFF, the storefront renders nothing
// newsletter-related anywhere.
//
// IMPORTANT: signups are a PUBLIC dynamic write, and the public site is served
// from a static host with NO functions (Vercel). So the form POSTs cross-origin
// to the Azure SWA Function (which has the secret Brevo API key). The absolute
// SWA origin works identically from the Vercel copy AND the SWA copy (same-origin
// there). It is overridable via NEXT_PUBLIC_API_BASE for template reuse.
import newsletterSettings from "@/data/newsletter-settings.json";

// Master on/off switch for the WHOLE newsletter feature. Defaults to OFF when the
// flag is missing/malformed — the feature ships disabled and the owner turns it on
// from the admin once Brevo is configured. Only an explicit `true` enables it.
export const newsletterEnabled: boolean =
  (newsletterSettings as { enabled?: boolean })?.enabled === true;

// The Azure SWA Functions origin (admin + write APIs live here). Hardcoded as the
// default — the public Vercel copy has no functions, so it must call this origin.
const DEFAULT_API_BASE = "https://jolly-bush-07bb10a03.7.azurestaticapps.net";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE || DEFAULT_API_BASE
).replace(/\/+$/, "");

// Public endpoint the storefront form POSTs to.
export const NEWSLETTER_ENDPOINT = `${API_BASE}/api/newsletter-subscribe`;
