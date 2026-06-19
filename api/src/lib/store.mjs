// Backend-agnostic content store for the admin panel. Pure logic on top of the
// chosen backend (GitHub in prod, local FS in dev). No Azure Functions imports
// here so the local dev harness can reuse it directly.
import { getBackend } from "./backend.mjs";

const PATHS = {
  site: "src/data/site.json",
  homepage: "src/data/homepage.json",
  products: "src/data/products.json",
  categories: "src/data/categories.json",
};

const PRODUCTS_DIR = "public/images/products";
const BANNERS_DIR = "public/images/banners";

// ---------- site & homepage ----------
export async function getSite() {
  return getBackend().readJSON(PATHS.site);
}
export async function putSite(obj) {
  return getBackend().writeJSON(PATHS.site, obj, "admin: update site settings");
}
export async function getHomepage() {
  return getBackend().readJSON(PATHS.homepage);
}
export async function putHomepage(obj) {
  return getBackend().writeJSON(PATHS.homepage, obj, "admin: update homepage");
}

// ---------- categories (read-only for v1) ----------
export async function getCategories() {
  return getBackend().readJSON(PATHS.categories);
}

// ---------- products ----------
export async function getProducts() {
  return getBackend().readJSON(PATHS.products);
}

export async function getProduct(id) {
  const products = await getProducts();
  return products.find((p) => String(p.id) === String(id)) || null;
}

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Normalise an incoming product payload into the stored shape.
function normalizeProduct(input, id) {
  const regularPrice = toNumber(input.regularPrice ?? input.price, 0);
  const onSale = Boolean(input.onSale);
  const salePrice = onSale
    ? toNumber(input.salePrice ?? input.price, regularPrice)
    : regularPrice;
  const price = onSale ? salePrice : regularPrice;
  const categoryIds = Array.isArray(input.categoryIds)
    ? input.categoryIds.map((c) => toNumber(c)).filter((c) => c > 0)
    : [];
  return {
    id,
    name: String(input.name ?? "").trim(),
    model: String(input.model ?? "").trim(),
    price,
    regularPrice,
    salePrice,
    onSale,
    image: String(input.image ?? `${"/images/products"}/${id}.jpg`),
    categoryIds,
    inStock: input.inStock === undefined ? true : Boolean(input.inStock),
    description: String(input.description ?? ""),
  };
}

function nextId(products) {
  return products.reduce((max, p) => Math.max(max, toNumber(p.id)), 0) + 1;
}

// Create or update. If input.id matches an existing product => update, else create.
export async function saveProduct(input) {
  const products = await getProducts();
  let id = toNumber(input.id, 0);
  const idx = id ? products.findIndex((p) => String(p.id) === String(id)) : -1;

  if (idx === -1) {
    // create
    if (!id) id = nextId(products);
    const product = normalizeProduct(input, id);
    products.push(product);
    products.sort((a, b) => toNumber(b.id) - toNumber(a.id));
    await getBackend().writeJSON(
      PATHS.products,
      products,
      `admin: add product ${id} (${product.name})`
    );
    return product;
  }

  // update — preserve image if caller didn't send one
  const existing = products[idx];
  const merged = normalizeProduct(
    { ...existing, ...input, image: input.image ?? existing.image },
    existing.id
  );
  products[idx] = merged;
  await getBackend().writeJSON(
    PATHS.products,
    products,
    `admin: update product ${existing.id} (${merged.name})`
  );
  return merged;
}

export async function deleteProduct(id) {
  const products = await getProducts();
  const idx = products.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return { ok: false, reason: "not_found" };
  const [removed] = products.splice(idx, 1);
  await getBackend().writeJSON(
    PATHS.products,
    products,
    `admin: delete product ${id} (${removed.name})`
  );
  // best-effort image cleanup
  if (removed.image && removed.image.startsWith("/images/products/")) {
    await getBackend().deleteFile(`public${removed.image}`).catch(() => {});
  }
  return { ok: true, id };
}

// ---------- image uploads ----------
const EXT_BY_TYPE = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function slugifyName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// payload: { kind: "product"|"banner", base64, contentType, id?, filename? }
// returns { path: "/images/...", repoPath: "public/images/..." }
export async function uploadImage(payload) {
  const { kind, base64, contentType } = payload;
  if (!base64) throw new Error("Missing image data.");
  const ext = EXT_BY_TYPE[contentType] || "jpg";
  const buffer = Buffer.from(base64, "base64");

  let repoPath;
  let publicPath;
  if (kind === "product") {
    const id = toNumber(payload.id);
    if (!id) throw new Error("Product upload requires an id.");
    publicPath = `/images/products/${id}.${ext}`;
    repoPath = `${PRODUCTS_DIR}/${id}.${ext}`;
  } else if (kind === "banner") {
    const base = slugifyName(payload.filename) || `banner-${Date.now()}`;
    const fname = base.includes(".") ? base : `${base}.${ext}`;
    publicPath = `/images/banners/${fname}`;
    repoPath = `${BANNERS_DIR}/${fname}`;
  } else {
    throw new Error(`Unknown upload kind: ${kind}`);
  }

  await getBackend().writeBinary(repoPath, buffer, `admin: upload ${repoPath}`);
  return { path: publicPath, repoPath };
}
