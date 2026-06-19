import { app } from "@azure/functions";
import { getHomepage, putHomepage } from "../lib/store.mjs";
import { json, requireAdmin, readBody } from "../lib/http.mjs";

app.http("homepage", {
  methods: ["GET", "PUT"],
  authLevel: "anonymous",
  route: "homepage",
  handler: async (request) => {
    const denied = await requireAdmin(request);
    if (denied) return denied;
    try {
      if (request.method === "GET") {
        return json(200, await getHomepage());
      }
      const body = await readBody(request);
      const saved = await putHomepage(body);
      return json(200, { ok: true, commit: saved.commit?.sha || null });
    } catch (err) {
      return json(500, { error: String(err.message || err) });
    }
  },
});
