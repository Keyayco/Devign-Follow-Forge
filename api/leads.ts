import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listByBusiness, createForBusiness } from "./_lib/crud.js";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return listByBusiness(req, res, "leads");
  if (req.method === "POST") return createForBusiness(req, res, "leads", { status: "New", ...(req.body || {}) });
  return res.status(405).json({ error: "Method not allowed" });
}
