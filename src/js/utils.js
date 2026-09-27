export const money = (value = 0) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(value || 0));
export const today = () => new Date().toISOString().slice(0, 10);
export const dateLabel = (value) => value ? new Date(value).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "Not set";
export const timeLabel = (value) => value || "";
export const escapeHtml = (str = "") => String(str).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
export const phoneHref = (phone) => `tel:${String(phone || "").replace(/\s+/g, "")}`;
export const mapsHref = (address) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || "")}`;
export const normalisePhone = (phone = "") => {
  let p = String(phone).replace(/[^0-9+]/g, "");
  if (p.startsWith("0")) p = `27${p.slice(1)}`;
  if (p.startsWith("+")) p = p.slice(1);
  return p;
};
export const waHref = (phone, text = "") => `https://wa.me/${normalisePhone(phone)}?text=${encodeURIComponent(text)}`;
export function toast(message, type = "ok") {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => { el.className = "toast"; }, 3400);
}
export function setRoute(route) { location.hash = route; }
export function getRoute() { return location.hash.replace(/^#/, "") || "/dashboard"; }
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export function quoteTotals(quote = {}, items = []) {
  const subtotal = items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unit_price || 0), 0);
  const discount = Number(quote.discount_amount || 0);
  const taxable = Math.max(0, subtotal - discount);
  const vat = quote.vat_enabled ? taxable * (Number(quote.vat_rate || 0) / 100) : 0;
  const total = taxable + vat;
  const deposit = Number(quote.deposit_amount || 0);
  const balance = Math.max(0, total - deposit);
  return { subtotal, discount, vat, total, deposit, balance };
}
export function serializeForm(form) {
  const data = new FormData(form);
  return Object.fromEntries([...data.entries()].map(([k, v]) => [k, typeof v === "string" ? v.trim() : v]));
}
export function publicUrlForSlug(slug) { return `${location.origin}/business/${slug}`; }
