# Source of Truth

## Product
A production-minded, mobile-first PWA for South African contractors and tradespeople. Core workflow: Lead → Customer → Quote → Follow-up → Job → Payment → Customer History.

## Non-negotiables implemented
- Vanilla HTML/CSS/JavaScript frontend (no React UI).
- Supabase Auth, PostgreSQL and Storage.
- Installable PWA with service worker shell caching.
- Browser-side PDF generation via jsPDF.
- WhatsApp uses standard `wa.me` links.
- Maps use normal Google Maps search links.
- Payments are tracking only; no payment processing.
- Online-first; no complex offline write sync.

## Necessary implementation note
The sandbox began as a React/Vite template. The React UI was bypassed and replaced with `src/app.js` plus `src/styles.css`. Vite remains only as a static build/dev tool.

## Privacy stance
Built with POPIA principles in mind: minimal data, authenticated access, RLS, tenant isolation. This is not POPIA certification.
