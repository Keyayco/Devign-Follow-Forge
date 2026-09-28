import type { VercelRequest } from "@vercel/node";

export function readRouteId(req: VercelRequest) {
  const raw = req.query.id;
  return Array.isArray(raw) ? raw[0] : String(raw || "");
}
