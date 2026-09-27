import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

async function authHeaders() {
  if (!supabase) return { "Content-Type": "application/json" };
  const { data } = await supabase.auth.getSession();
  return {
    "Content-Type": "application/json",
    ...(data.session?.access_token ? { Authorization: `Bearer ${data.session.access_token}` } : {}),
  };
}

async function request(path, options = {}) {
  const headers = await authHeaders();
  const res = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  if (!res.ok) throw new Error(json?.error || "Request failed. Check your connection and try again.");
  return json;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body || {}) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body || {}) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export async function uploadPhoto(file, businessId, entity, entityId) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const compressed = await compressImage(file);
  const ext = compressed.type.includes("png") ? "png" : "jpg";
  const path = `${businessId}/${entity}/${entityId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("business-photos").upload(path, compressed, { upsert: false });
  if (error) throw new Error("Could not upload photo.");
  return path;
}

export async function getSignedPhotoUrl(path) {
  if (!supabase || !path) return "";
  const { data, error } = await supabase.storage.from("business-photos").createSignedUrl(path, 60 * 10);
  if (error) return "";
  return data.signedUrl;
}

async function compressImage(file) {
  if (!file.type.startsWith("image/") || file.size < 850000) return file;
  const bitmap = await createImageBitmap(file);
  const max = 1600;
  const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return await new Promise((resolve) => canvas.toBlob((blob) => resolve(blob || file), "image/jpeg", 0.78));
}
