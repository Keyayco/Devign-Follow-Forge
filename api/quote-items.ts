import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createForBusiness, listByBusiness } from "./_lib/crud.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return listByBusiness(req, res, "quote_items", "sort_order", true);
  if (req.method === "POST") return createForBusiness(req, res, "quote_items", req.body || {});
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
