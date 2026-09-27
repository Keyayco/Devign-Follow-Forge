import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./supabase-admin.js";

export async function getUser(req: VercelRequest) {
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function requireUser(req: VercelRequest, res: VercelResponse) {
  const user = await getUser(req);
  if (!user) {
    res.status(401).json({ error: "Please log in again." });
    return null;
  }
  return user;
}

export async function requireBusinessAccess(req: VercelRequest, res: VercelResponse, businessId: string) {
  const user = await requireUser(req, res);
  if (!user) return null;
  const { data, error } = await supabaseAdmin
    .from("business_members")
    .select("role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data) {
    res.status(403).json({ error: "You do not have access to this business." });
    return null;
  }
  return { user, role: data.role };
}

export function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : value;
}
