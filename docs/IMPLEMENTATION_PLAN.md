# Upfront Implementation Plan

## 1. Architecture

- Static vanilla PWA hosted on Netlify/Cloudflare Pages.
- Supabase Auth for registration/login/session/password reset.
- Supabase PostgreSQL for business data.
- Supabase Storage for logos/photos.
- RLS isolates every business-owned record through `business_members`.
- Serverless functions perform trusted workflow operations and storage upload.
- Browser generates PDFs; WhatsApp and Maps use standard outbound links.

## 2. Database schema

Tables: `businesses`, `business_members`, `customers`, `leads`, `quotes`, `quote_items`, `follow_ups`, `jobs`, `payments`, `message_templates`, `activity_logs`.

All primary keys are UUIDs. Business-owned rows include `business_id`. Useful indexes are included for dashboard/status/date queries. RLS policies require authenticated membership for CRUD. Public business pages are readable only when `public_enabled = true`.

See `supabase/schema.sql` for the executable schema.

## 3. Repository/file structure

- `index.html` vanilla PWA entry.
- `src/app.js` application logic.
- `src/style.css` mobile-first UI.
- `public/manifest.webmanifest`, `public/sw.js`, `public/icons/*` PWA assets.
- `api/*` serverless workflow/storage routes.
- `supabase/schema.sql` database/RLS/storage setup.
- `docs/*` project memory and handoff.
- `README.md` setup/deployment.

## 4. Development order

Implemented in requested order: auth/business, dashboard, customers, leads, quotes, PDF, WhatsApp actions, follow-ups, jobs, payments, templates, public page, PWA installation and basic caching.

## 5. R0 risks

R0 is realistic for a demo/MVP but not guaranteed forever. Free tiers have usage limits, email/password reset deliverability depends on Supabase Auth configuration, and production scale may eventually require paid Supabase or hosting plans. No paid APIs are required by the MVP architecture.
