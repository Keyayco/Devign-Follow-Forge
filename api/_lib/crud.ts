import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./supabase-admin.js";
import { requireBusinessAccess } from "./auth.js";

export async function listByBusiness(req: VercelRequest, res: VercelResponse, table: string, order = "created_at", ascending = false) {
  const businessId = String(req.query.business_id || "");
  const access = await requireBusinessAccess(req, res, businessId);
  if (!access) return;
  const { data, error } = await supabaseAdmin.from(table).select("*").eq("business_id", businessId).order(order, { ascending });
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json(data || []);
}

export async function createForBusiness(req: VercelRequest, res: VercelResponse, table: string, body: Record<string, unknown>) {
  const businessId = String(body.business_id || "");
  const access = await requireBusinessAccess(req, res, businessId);
  if (!access) return;
  const { data, error } = await supabaseAdmin.from(table).insert(body).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await supabaseAdmin.from("activity_logs").insert({ business_id: businessId, entity_type: table, entity_id: data.id, action: "Created" });
  return res.status(201).json(data);
}

export async function patchById(req: VercelRequest, res: VercelResponse, table: string, id: string, body: Record<string, unknown>) {
  const { data: existing, error: findError } = await supabaseAdmin.from(table).select("business_id").eq("id", id).single();
  if (findError) return res.status(404).json({ error: findError.message });
  const access = await requireBusinessAccess(req, res, existing.business_id);
  if (!access) return;
  const { data, error } = await supabaseAdmin.from(table).update(body).eq("id", id).select().single();
  if (error) return res.status(400).json({ error: error.message });
  await supabaseAdmin.from("activity_logs").insert({ business_id: existing.business_id, entity_type: table, entity_id: id, action: "Updated" });
  return res.status(200).json(data);
}

export async function archiveById(req: VercelRequest, res: VercelResponse, table: string, id: string) {
  return patchById(req, res, table, id, { archived: true });
}
