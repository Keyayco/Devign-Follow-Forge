import type { VercelRequest, VercelResponse } from "@vercel/node";
import { patchById, archiveById } from "../_lib/crud.js";
export default async function handler(req: VercelRequest, res: VercelResponse) { const id = String(Array.isArray(req.query.id)?req.query.id[0]:req.query.id); if(req.method==="PATCH") return patchById(req,res,"follow_ups",id,req.body||{}); if(req.method==="DELETE") return archiveById(req,res,"follow_ups",id); return res.status(405).json({error:"Method not allowed"}); }
