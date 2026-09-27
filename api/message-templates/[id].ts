import type { VercelRequest, VercelResponse } from "@vercel/node";
import { item } from "../_lib/resource.js";
export default async function handler(req: VercelRequest, res: VercelResponse) { return item(req, res, "message_templates" ); }
