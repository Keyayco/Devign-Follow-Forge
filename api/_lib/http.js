export function json(res, status, payload) {
  res.status(status).json(payload);
}

export function error(res, status, message) {
  res.status(status).json({ error: message });
}

export function requireMethod(req, res, methods) {
  if (methods.includes(req.method)) return true;
  res.setHeader("Allow", methods.join(", "));
  error(res, 405, "Method not allowed");
  return false;
}

export function readId(req) {
  const raw = req.query?.id;
  return Array.isArray(raw) ? raw[0] : raw;
}

export function safeString(value) {
  return String(value ?? "").trim();
}

export function numeric(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
