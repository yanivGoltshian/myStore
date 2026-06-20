import { app } from "@azure/functions";
import {
  getLightingProduct,
  saveLightingProduct,
  deleteLightingProduct,
} from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

// Item: GET / PUT / DELETE a single lighting product by id.
app.http("lighting-product", {
  methods: ["GET", "PUT", "DELETE"],
  authLevel: "anonymous",
  route: "lighting/products/{id}",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    const id = request.params.id;
    try {
      if (request.method === "GET") {
        const product = await getLightingProduct(id);
        return product ? json(200, product) : json(404, { error: "Not found" });
      }
      if (request.method === "DELETE") {
        const res = await deleteLightingProduct(id);
        return res.ok ? json(200, res) : json(404, { error: "Not found" });
      }
      // PUT update
      const body = await readBody(request);
      body.id = Number(id);
      const saved = await saveLightingProduct(body);
      return json(200, saved);
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
