import { supabaseAdmin } from "./supabase-admin.js";

export async function getUser(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { user: null, error: "Missing session" };
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) return { user: null, error: "Invalid session" };
  return { user: data.user, token };
}

export async function requireUser(req, res) {
  const { user, error } = await getUser(req);
  if (!user) {
    res.status(401).json({ error: error || "Please sign in again." });
    return null;
  }
  return user;
}

export async function requireBusinessAccess(req, res, businessId) {
  const user = await requireUser(req, res);
  if (!user) return null;
  if (!businessId) {
    res.status(400).json({ error: "Business is required." });
    return null;
  }
  const { data, error } = await supabaseAdmin
    .from("business_members")
    .select("business_id, role")
    .eq("business_id", businessId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    res.status(500).json({ error: error.message });
    return null;
  }
  if (!data) {
    res.status(403).json({ error: "You do not have access to this business." });
    return null;
  }
  return { user, member: data };
}

export async function listBusinessIdsForUser(userId) {
  const { data, error } = await supabaseAdmin.from("business_members").select("business_id").eq("user_id", userId);
  if (error) throw error;
  return (data || []).map((row) => row.business_id);
}
