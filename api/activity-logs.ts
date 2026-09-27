import type { VercelRequest, VercelResponse } from "@vercel/node";
import { collection } from "./_lib/resource.js";
export default async function handler(req: VercelRequest, res: VercelResponse) { return collection(req, res, "activity_logs", { order: "created_at" }); }
