import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin } from "./_lib/supabase-admin.js";
import { requireUser } from "./_lib/auth.js";

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 64); }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res);
  if (!user) return;
  if (req.method === "GET") {
    const { data, error } = await supabaseAdmin.from("business_members").select("businesses(*)").eq("user_id", user.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map((r: any) => r.businesses).filter(Boolean));
  }
  if (req.method === "POST") {
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Business name is required." });
    const insert = { ...body, slug: body.slug ? slugify(String(body.slug)) : slugify(name), owner_id: user.id };
    const { data: business, error } = await supabaseAdmin.from("businesses").insert(insert).select().single();
    if (error) return res.status(400).json({ error: error.message });
    await supabaseAdmin.from("business_members").insert({ business_id: business.id, user_id: user.id, role: "owner" });
    await seedTemplates(business.id);
    return res.status(201).json(business);
  }
  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ error: "Method not allowed" });
}
async function seedTemplates(businessId: string) {
  const rows = [
    ["New enquiry", "Hi {{customer}}, thanks for contacting {{business}}. Please send any photos and the job address so we can assist."],
    ["Site visit", "Hi {{customer}}, this is {{business}}. We can come for a site visit on {{date}}. Does that suit you?"],
    ["Quote sent", "Hi {{customer}}, your quote {{quote}} for {{amount}} has been sent. Please let us know if you have questions."],
    ["Quote follow-up", "Hi {{customer}}, just following up on quote {{quote}} from {{business}}. Are you happy for us to proceed?"],
    ["Job reminder", "Hi {{customer}}, reminder that {{business}} is booked for {{job}} on {{date}}."],
    ["Job completed", "Hi {{customer}}, thanks for using {{business}}. The job is complete. Please let us know if anything needs attention."],
    ["Payment reminder", "Hi {{customer}}, friendly reminder that the outstanding balance is {{amount}}. Thank you."],
    ["Review request", "Hi {{customer}}, thank you for your support. If you were happy with the work, please send us a short review."],
  ].map(([name, body]) => ({ business_id: businessId, name, body }));
  await supabaseAdmin.from("message_templates").insert(rows);
}
