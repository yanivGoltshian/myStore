import { app } from "@azure/functions";
import { getLightingSubcats } from "../lib/store.mjs";
import { json, requireAdmin } from "../lib/http.mjs";

// GET the 17 lighting subcategories ({ id, name, count, thumb }).
app.http("lighting-subcats", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "lighting/subcats",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      return json(200, await getLightingSubcats());
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
