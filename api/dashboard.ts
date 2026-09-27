import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { requireBusinessAccess } from "./_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const businessId = String(req.query.business_id || "");
  const access = await requireBusinessAccess(req, res, businessId);
  if (!access) return;
  const today = new Date().toISOString().slice(0, 10);
  const [leads, quotes, followups, jobs, payments, logs] = await Promise.all([
    supabaseAdmin.from("leads").select("id,status").eq("business_id", businessId).is("archived_at", null),
    supabaseAdmin.from("quotes").select("id,status,total_amount").eq("business_id", businessId).is("archived_at", null),
    supabaseAdmin.from("follow_ups").select("id,status,due_date").eq("business_id", businessId).is("archived_at", null),
    supabaseAdmin.from("jobs").select("id,status,job_date").eq("business_id", businessId).is("archived_at", null),
    supabaseAdmin.from("payments").select("id,status,balance").eq("business_id", businessId).is("archived_at", null),
    supabaseAdmin.from("activity_logs").select("*").eq("business_id", businessId).order("created_at", { ascending: false }).limit(100),
  ]);
  const outstanding = payments.data?.filter(p => p.status !== "Paid") || [];
  return res.status(200).json({
    new_leads: leads.data?.filter(l => l.status === "New").length || 0,
    quotes_awaiting: quotes.data?.filter(q => ["Draft", "Sent", "Awaiting Response"].includes(q.status)).length || 0,
    followups_due: followups.data?.filter(f => f.status !== "Completed" && f.due_date <= today).length || 0,
    upcoming_jobs: jobs.data?.filter(j => j.status !== "Completed" && j.job_date >= today).length || 0,
    outstanding_payments: outstanding.length,
    outstanding_amount: outstanding.reduce((sum, p) => sum + Number(p.balance || 0), 0),
    activity_logs: logs.data || [],
  });
}
