import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { requireBusinessAccess } from "./_lib/auth.js";

export const config = { api: { bodyParser: { sizeLimit: "8mb" } } };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const businessId = String(req.body?.business_id || "");
  const entity = String(req.body?.entity || "general").replace(/[^a-z0-9_-]/gi, "");
  const fileName = String(req.body?.file_name || "photo.jpg").replace(/[^a-z0-9_.-]/gi, "");
  const contentType = String(req.body?.content_type || "image/jpeg");
  const base64 = String(req.body?.base64 || "");
  const access = await requireBusinessAccess(req, res, businessId);
  if (!access) return;
  if (!base64.startsWith("data:image/")) return res.status(400).json({ error: "Only image uploads are supported" });
  const data = base64.split(",")[1];
  const buffer = Buffer.from(data, "base64");
  const path = `${businessId}/${entity}/${Date.now()}-${fileName}`;
  const { error } = await supabaseAdmin.storage.from("business-files").upload(path, buffer, { contentType, upsert: false });
  if (error) return res.status(400).json({ error: "Could not upload photo." });
  const { data: signed } = await supabaseAdmin.storage.from("business-files").createSignedUrl(path, 60 * 60 * 24 * 7);
  return res.status(201).json({ path, url: signed?.signedUrl || null });
}
