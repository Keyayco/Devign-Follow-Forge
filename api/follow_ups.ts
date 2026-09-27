import type { VercelRequest, VercelResponse } from "@vercel/node";
import { listByBusiness, createForBusiness } from "./_lib/crud.js";
export default async function handler(req: VercelRequest, res: VercelResponse) { if(req.method==="GET") return listByBusiness(req,res,"follow_ups","due_date"); if(req.method==="POST") return createForBusiness(req,res,"follow_ups",req.body||{}); return res.status(405).json({error:"Method not allowed"}); }
