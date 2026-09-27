import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listByBusiness, createForBusiness } from "./_lib/crud.js";
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return listByBusiness(req, res, "payments");
  if (req.method === "POST") {
    const body = req.body || {};
    body.balance = Number(body.amount || 0) - Number(body.amount_paid || 0);
    return createForBusiness(req, res, "payments", body);
  }
  return res.status(405).json({ error: "Method not allowed" });
}
