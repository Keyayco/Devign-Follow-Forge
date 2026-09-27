import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { requireBusinessAccess } from "./_lib/auth.js";
import { collection } from "./_lib/resource.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") return collection(req, res, "quotes", { order: "created_at" });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const payload = req.body || {};
  const access = await requireBusinessAccess(req, res, payload.business_id);
  if (!access) return;
  const { data, error } = await supabaseAdmin.from("quotes").insert(payload).select().single();
  if (error) return res.status(400).json({ error: error.message });
  const due = new Date(); due.setDate(due.getDate() + 2);
  if (data.customer_id) {
    await supabaseAdmin.from("follow_ups").insert({ business_id: data.business_id, customer_id: data.customer_id, quote_id: data.id, due_date: due.toISOString().slice(0,10), status: "Due", result: "Waiting", note: "Quote sent follow-up" });
  }
  await supabaseAdmin.from("activity_logs").insert({ business_id: data.business_id, entity_type: "quote", entity_id: data.id, action: "Quote created", note: data.quote_number });
  return res.status(201).json(data);
}
