import { supabaseAdmin } from "./supabase-admin.js";
import { requireBusinessAccess, listBusinessIdsForUser, requireUser } from "./auth.js";
import { error, json, readId } from "./http.js";

const ALLOWED = new Set([
  "customers",
  "leads",
  "quotes",
  "quote_items",
  "follow_ups",
  "jobs",
  "payments",
  "message_templates",
  "activity_logs",
]);

const TABLE_BUSINESS_COLUMN = {
  customers: "business_id",
  leads: "business_id",
  quotes: "business_id",
  follow_ups: "business_id",
  jobs: "business_id",
  payments: "business_id",
  message_templates: "business_id",
  activity_logs: "business_id",
};

export async function collection(req, res, table, opts = {}) {
  if (!ALLOWED.has(table)) return error(res, 404, "Unknown resource");
  try {
    if (req.method === "GET") {
      const user = await requireUser(req, res);
      if (!user) return;
      let businessId = req.query?.business_id;
      if (Array.isArray(businessId)) businessId = businessId[0];
      const businessIds = businessId ? [businessId] : await listBusinessIdsForUser(user.id);
      if (businessId) {
        const access = await requireBusinessAccess(req, res, businessId);
        if (!access) return;
      }
      let query = supabaseAdmin.from(table).select(opts.select || "*");
      const businessColumn = TABLE_BUSINESS_COLUMN[table];
      if (businessColumn) query = query.in(businessColumn, businessIds.length ? businessIds : ["00000000-0000-0000-0000-000000000000"]);
      if (req.query?.status) query = query.eq("status", req.query.status);
      if (req.query?.customer_id) query = query.eq("customer_id", req.query.customer_id);
      if (req.query?.quote_id) query = query.eq("quote_id", req.query.quote_id);
      if (req.query?.entity_type) query = query.eq("entity_type", req.query.entity_type);
      if (req.query?.entity_id) query = query.eq("entity_id", req.query.entity_id);
      const order = opts.order || "created_at";
      query = query.order(order, { ascending: opts.ascending ?? false });
      const { data, error: dbError } = await query;
      if (dbError) return error(res, 500, dbError.message);
      return json(res, 200, data || []);
    }
    if (req.method === "POST") {
      const payload = req.body || {};
      const businessId = payload.business_id;
      const access = await requireBusinessAccess(req, res, businessId);
      if (!access) return;
      const clean = opts.prepareCreate ? await opts.prepareCreate(payload, access.user) : payload;
      const { data, error: dbError } = await supabaseAdmin.from(table).insert(clean).select().single();
      if (dbError) return error(res, 400, dbError.message);
      return json(res, 201, data);
    }
    res.setHeader("Allow", "GET, POST");
    return error(res, 405, "Method not allowed");
  } catch (err) {
    return error(res, 500, err instanceof Error ? err.message : "Server error");
  }
}

export async function item(req, res, table, opts = {}) {
  if (!ALLOWED.has(table)) return error(res, 404, "Unknown resource");
  try {
    const id = readId(req);
    if (!id) return error(res, 400, "ID is required");
    const { data: existing, error: readError } = await supabaseAdmin.from(table).select("*").eq("id", id).maybeSingle();
    if (readError) return error(res, 500, readError.message);
    if (!existing) return error(res, 404, "Not found");
    const businessId = existing.business_id || req.body?.business_id;
    if (businessId) {
      const access = await requireBusinessAccess(req, res, businessId);
      if (!access) return;
    } else {
      const user = await requireUser(req, res);
      if (!user) return;
    }
    if (req.method === "GET") return json(res, 200, existing);
    if (req.method === "PATCH") {
      const payload = opts.prepareUpdate ? await opts.prepareUpdate(req.body || {}, existing) : req.body || {};
      const { data, error: dbError } = await supabaseAdmin.from(table).update(payload).eq("id", id).select().single();
      if (dbError) return error(res, 400, dbError.message);
      return json(res, 200, data);
    }
    if (req.method === "DELETE") {
      if (opts.archive) {
        const { data, error: dbError } = await supabaseAdmin.from(table).update({ archived: true }).eq("id", id).select().single();
        if (dbError) return error(res, 400, dbError.message);
        return json(res, 200, data);
      }
      const { error: dbError } = await supabaseAdmin.from(table).delete().eq("id", id);
      if (dbError) return error(res, 400, dbError.message);
      return json(res, 200, { ok: true });
    }
    res.setHeader("Allow", "GET, PATCH, DELETE");
    return error(res, 405, "Method not allowed");
  } catch (err) {
    return error(res, 500, err instanceof Error ? err.message : "Server error");
  }
}
