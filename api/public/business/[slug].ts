import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/supabase-admin.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const slug = Array.isArray(req.query.slug) ? req.query.slug[0] : req.query.slug;
  const { data, error } = await supabaseAdmin.from("businesses").select("slug,name,logo_path,phone,whatsapp,email,address,service_area,services,hours,description").eq("slug", slug).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Business not found" });
  return res.status(200).json(data);
}
