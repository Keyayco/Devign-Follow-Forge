import { defineConfig, type Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

function devApiPlugin(): Plugin {
  return {
    name: "contractor-api-dev",
    configureServer(server) {
      server.middlewares.use("/api", async (req, res, next) => {
        try {
          const url = req.url || "";
          let mod: any;
          let query: Record<string, string> = {};
          if (url.match(/^\/leads\/[^/]+\/convert/)) {
            query.id = url.split("/")[2];
            mod = await import("./api/leads/[id]/convert.ts");
          } else if (url.match(/^\/quotes\/[^/]+\/items/)) {
            query.id = url.split("/")[2];
            mod = await import("./api/quotes/[id]/items.ts");
          } else if (url.match(/^\/quotes\/[^/]+\/accept/)) {
            query.id = url.split("/")[2];
            mod = await import("./api/quotes/[id]/accept.ts");
          } else if (url.startsWith("/uploads")) {
            mod = await import("./api/uploads.ts");
          } else return next();
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(Buffer.from(chunk));
          const raw = Buffer.concat(chunks).toString();
          (req as any).body = raw ? JSON.parse(raw) : {};
          (req as any).query = query;
          const response = res as any;
          response.status = (code: number) => { res.statusCode = code; return response; };
          response.json = (data: unknown) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(data)); return response; };
          await mod.default(req, response);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err instanceof Error ? err.message : "Server error" }));
        }
      });
    },
  };
}

export default defineConfig({
  optimizeDeps: { exclude: ["@electric-sql/pglite"] },
  plugins: [tailwindcss(), devApiPlugin()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    // strictPort: a stale "npm run dev" leaves Vite drifting to 5174/5175 and the
    // saved app.url (which routes to the bare host = primary port) intermittently
    // 502s. Crash on conflict instead so the wake handler sees a real error.
    strictPort: true,
    // allowedHosts must be true: sandboxes are accessed via dynamic Vercel-assigned hostnames
    allowedHosts: true,
    // The preview iframe loads the app through the vercel.run edge proxy on
    // 443 (wss), not directly on 5173. Without this, Vite's HMR client opens
    // its WebSocket against :5173 (the dev-server port), which the proxy does
    // not expose — the socket drops, the client logs "server connection lost.
    // Polling for restart...", and forces a full page reload on reconnect, so
    // the preview appears to refresh even though nothing changed.
    hmr: { clientPort: 443, protocol: "wss" },
  },
});
