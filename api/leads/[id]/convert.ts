import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/supabase-admin.js";
import { requireBusinessAccess } from "../../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const { data: lead, error: leadError } = await supabaseAdmin.from("leads").select("*").eq("id", id).single();
  if (leadError) return res.status(404).json({ error: leadError.message });
  const access = await requireBusinessAccess(req, res, lead.business_id);
  if (!access) return;
  let customerId = lead.customer_id;
  if (!customerId) {
    const { data: customer, error } = await supabaseAdmin.from("customers").insert({
      business_id: lead.business_id,
      name: lead.customer_name,
      phone: lead.phone,
      whatsapp: lead.whatsapp,
      email: lead.email,
      address: lead.location,
      notes: lead.notes,
      photo_paths: lead.photo_paths || [],
    }).select().single();
    if (error) return res.status(400).json({ error: error.message });
    customerId = customer.id;
  }
  await supabaseAdmin.from("leads").update({ customer_id: customerId, status: "Contacted" }).eq("id", id);
  await supabaseAdmin.from("activity_logs").insert({ business_id: lead.business_id, entity_type: "customer", entity_id: customerId, action: "Lead converted", note: lead.description });
  return res.status(200).json({ customer_id: customerId });
}
