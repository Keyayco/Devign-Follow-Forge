import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../_lib/supabase-admin.js";
import { requireUser } from "../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  const { data, error } = await supabaseAdmin.from("business_members").select("business_id, role, businesses(*)").eq("user_id", user.id);
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ user: { id: user.id, email: user.email }, memberships: data || [] });
}
