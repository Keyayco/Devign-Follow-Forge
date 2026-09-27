import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { requireBusinessAccess } from "./_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { business_id, entity, filename, content_type, data_url } = req.body || {};
  const access = await requireBusinessAccess(req, res, business_id);
  if (!access) return;
  if (!data_url || !filename) return res.status(400).json({ error: "Photo data is required." });
  const base64 = String(data_url).split(",").pop() || "";
  const buffer = Buffer.from(base64, "base64");
  if (buffer.length > 2_500_000) return res.status(400).json({ error: "Photo is too large after compression." });
  const safeName = String(filename).replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${business_id}/${entity || "photos"}/${Date.now()}-${safeName}`;
  const { error } = await supabaseAdmin.storage.from("contractor-photos").upload(path, buffer, { contentType: content_type || "image/jpeg", upsert: false });
  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json({ path });
}
