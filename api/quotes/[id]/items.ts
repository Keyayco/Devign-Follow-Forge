import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/supabase-admin.js";
import { requireBusinessAccess } from "../../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!["PUT", "POST"].includes(req.method || "")) return res.status(405).json({ error: "Method not allowed" });
  const quoteId = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const { data: quote, error: quoteError } = await supabaseAdmin.from("quotes").select("id,business_id").eq("id", quoteId).single();
  if (quoteError) return res.status(404).json({ error: quoteError.message });
  const access = await requireBusinessAccess(req, res, quote.business_id);
  if (!access) return;
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  await supabaseAdmin.from("quote_items").delete().eq("quote_id", quoteId);
  if (items.length) {
    const rows = items.map((item: any, index: number) => ({
      business_id: quote.business_id,
      quote_id: quoteId,
      description: String(item.description || "Item"),
      quantity: Number(item.quantity || 1),
      unit_price: Number(item.unit_price || 0),
      sort_order: index,
    }));
    const { error } = await supabaseAdmin.from("quote_items").insert(rows);
    if (error) return res.status(400).json({ error: error.message });
  }
  return res.status(200).json({ ok: true });
}
