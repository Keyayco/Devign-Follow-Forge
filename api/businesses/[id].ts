import type { VercelRequest, VercelResponse } from "@vercel/node";
import { patchById } from "../_lib/crud.js";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (req.method === "PATCH") return patchById(req, res, "businesses", String(id), req.body || {});
  return res.status(405).json({ error: "Method not allowed" });
}
