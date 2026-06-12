import { defineConfig, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Stateless mock API. The client owns all state (localStorage); the server
 * acknowledges commands so the app performs real HTTP round trips that
 * Playwright can intercept (`page.route`) to simulate failures, delays,
 * and conflicts, and to assert request payloads.
 */
function mockApiPlugin(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith("/api/")) {
      next();
      return;
    }
    const respond = (status: number, body: unknown) => {
      res.statusCode = status;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(body));
    };
    if (req.method === "GET" && req.url === "/api/health") {
      respond(200, { ok: true });
      return;
    }
    if (["POST", "PATCH", "DELETE"].includes(req.method ?? "")) {
      respond(200, { ok: true });
      return;
    }
    respond(404, { error: "Not found" });
  };

  return {
    name: "mock-api",
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), mockApiPlugin()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
});
