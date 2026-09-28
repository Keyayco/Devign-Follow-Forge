import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listByBusiness } from "./_lib/crud.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return listByBusiness(req, res, "activity_logs", "created_at");
  res.setHeader("Allow", "GET");
  return res.status(405).json({ error: "Method not allowed" });
}
