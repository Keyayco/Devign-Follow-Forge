import type { VercelRequest, VercelResponse } from "@vercel/node";
import { patchById } from "../_lib/crud.js";
import { readRouteId } from "../_lib/route-id.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = readRouteId(req);
  if (!id) return res.status(400).json({ error: "ID is required" });
  if (req.method === "PATCH") return patchById(req, res, "payments", id, req.body || {});
  res.setHeader("Allow", "PATCH");
  return res.status(405).json({ error: "Method not allowed" });
}
