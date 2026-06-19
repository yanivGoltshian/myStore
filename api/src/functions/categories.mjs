import { app } from "@azure/functions";
import { getCategories } from "../lib/store.mjs";
import { json, requireAdmin } from "../lib/http.mjs";

app.http("categories", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "categories",
  handler: async (request) => {
    const denied = requireAdmin(request);
    if (denied) return denied;
    try {
      return json(200, await getCategories());
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
