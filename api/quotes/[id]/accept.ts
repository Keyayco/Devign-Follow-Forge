import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "../../_lib/supabase-admin.js";
import { requireBusinessAccess } from "../../_lib/auth.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  const { data: quote, error: quoteError } = await supabaseAdmin.from("quotes").select("*").eq("id", id).single();
  if (quoteError) return res.status(404).json({ error: quoteError.message });
  const access = await requireBusinessAccess(req, res, quote.business_id);
  if (!access) return;
  const { data: items } = await supabaseAdmin.from("quote_items").select("quantity, unit_price").eq("quote_id", id);
  const subtotal = (items || []).reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
  const discount = Number(quote.discount || 0);
  const vat = quote.vat_enabled ? Math.max(0, subtotal - discount) * Number(quote.vat_rate || 0) / 100 : 0;
  const total = Math.max(0, subtotal - discount) + vat;
  const deposit = Number(quote.deposit || 0);
  const amountPaid = deposit > 0 ? deposit : 0;

  await supabaseAdmin.from("quotes").update({ status: "Accepted" }).eq("id", id);
  await supabaseAdmin.from("follow_ups").update({ status: "Completed", result: "Accepted" }).eq("quote_id", id);
  const { data: customer } = await supabaseAdmin.from("customers").select("address").eq("id", quote.customer_id).single();
  const { data: job, error: jobError } = await supabaseAdmin.from("jobs").insert({
    business_id: quote.business_id,
    customer_id: quote.customer_id,
    quote_id: quote.id,
    address: customer?.address || null,
    description: quote.description || "Accepted quote job",
    job_date: req.body?.job_date || null,
    job_time: req.body?.job_time || null,
    worker: req.body?.worker || "Owner",
    status: "Booked",
  }).select().single();
  if (jobError) return res.status(400).json({ error: jobError.message });
  await supabaseAdmin.from("payments").insert({
    business_id: quote.business_id,
    customer_id: quote.customer_id,
    quote_id: quote.id,
    job_id: job.id,
    amount: total,
    deposit,
    amount_paid: amountPaid,
    status: amountPaid >= total ? "Paid" : amountPaid > 0 ? "Deposit Paid" : "Unpaid",
    payment_date: amountPaid > 0 ? new Date().toISOString().slice(0, 10) : null,
    method: "Tracking only",
  });
  await supabaseAdmin.from("activity_logs").insert({ business_id: quote.business_id, entity_type: "quote", entity_id: quote.id, action: "Quote accepted", note: "Job and payment tracking created" });
  return res.status(200).json({ job_id: job.id });
}
