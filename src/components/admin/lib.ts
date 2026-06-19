import type { Product } from "@/lib/types";

// --- Admin auth token (Google ID token) -----------------------------------
// The admin panel signs in with Google and stores the returned ID token here.
// Every API call carries it as `Authorization: Bearer <token>`; the Azure
// Function verifies it against Google + the email allowlist on the server.
const TOKEN_KEY = "hankin-admin-token";
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* sessionStorage unavailable */
  }
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  try {
    authToken = sessionStorage.getItem(TOKEN_KEY);
  } catch {
    authToken = null;
  }
  return authToken;
}

function withAuth(headers: Record<string, string>): Record<string, string> {
  const t = getAuthToken();
  return t ? { ...headers, authorization: `Bearer ${t}` } : headers;
}

export type AdminAuthConfig = { googleClientId: string };

export async function getAuthConfig(): Promise<AdminAuthConfig> {
  try {
    const r = await fetch("/admin-auth.json", { cache: "no-store" });
    if (r.ok) {
      const j = (await r.json()) as Partial<AdminAuthConfig>;
      return { googleClientId: String(j.googleClientId || "") };
    }
  } catch {
    /* missing/unreachable config → treat as not configured */
  }
  return { googleClientId: "" };
}

async function safeErr(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as { error?: string };
    return j?.error || r.statusText;
  } catch {
    return r.statusText;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, { headers: withAuth({ accept: "application/json" }) });
  if (!r.ok) throw new Error(`(${r.status}) ${await safeErr(r)}`);
  return (await r.json()) as T;
}

export async function apiSend<T>(
  path: string,
  method: string,
  body: unknown
): Promise<T> {
  const r = await fetch(path, {
    method,
    headers: withAuth({ "content-type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`(${r.status}) ${await safeErr(r)}`);
  return (await r.json()) as T;
}

export function fileToData(
  file: File
): Promise<{ base64: string; contentType: string }> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onerror = () => reject(new Error("שגיאה בקריאת הקובץ"));
    fr.onload = () => {
      const res = String(fr.result || "");
      const comma = res.indexOf(",");
      resolve({
        base64: comma >= 0 ? res.slice(comma + 1) : res,
        contentType: file.type || "image/jpeg",
      });
    };
    fr.readAsDataURL(file);
  });
}

export async function uploadImage(
  kind: "product" | "banner",
  file: File,
  opts: Record<string, unknown> = {}
): Promise<string> {
  const { base64, contentType } = await fileToData(file);
  const res = await apiSend<{ path: string }>("/api/upload", "POST", {
    kind,
    base64,
    contentType,
    filename: file.name,
    ...opts,
  });
  return res.path;
}

const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export function formatPrice(n: number): string {
  return ils.format(n || 0);
}

export type ProductList = { count: number; products: Product[] };

export type Principal = {
  clientPrincipal: {
    userId: string;
    userDetails: string;
    identityProvider: string;
    userRoles: string[];
  } | null;
};
