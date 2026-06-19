import type { Product } from "@/lib/types";

async function safeErr(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as { error?: string };
    return j?.error || r.statusText;
  } catch {
    return r.statusText;
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(path, { headers: { accept: "application/json" } });
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
    headers: { "content-type": "application/json" },
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
