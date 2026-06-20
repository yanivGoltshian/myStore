import { app } from "@azure/functions";
import { listLightingProducts, saveLightingProduct } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Collection: GET list (?sub= subcat, ?q= search, ?page=, ?pageSize=), POST create.
// Lighting has thousands of items so the list is always paginated.
app.http("lighting-products", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  route: "lighting/products",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      if (request.method === "GET") {
        const result = await listLightingProducts({
          subId: Number(request.query.get("sub") || 0),
          q: request.query.get("q") || "",
          page: Number(request.query.get("page") || 1),
          pageSize: Number(request.query.get("pageSize") || 60),
        });
        return json(200, result);
      }
      // POST create (input.subId selects the target subcategory)
      const body = await readBody(request);
      delete body.id;
      const created = await saveLightingProduct(body);
      return json(201, created);
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
