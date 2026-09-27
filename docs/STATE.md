# Current State

## Implemented
- Vanilla JS mobile-first PWA shell.
- Supabase Auth registration/login/logout/password reset.
- Business creation/profile editing and business switching.
- Dashboard showing leads, quote follow-ups, jobs and payment totals.
- Customers, leads, quotes, follow-ups, jobs, payments and message templates CRUD.
- Lead conversion to customer in frontend workflow.
- Quote builder with configurable VAT, discount, deposit and line items.
- Browser PDF download.
- WhatsApp prefilled messages using editable templates.
- Normal Google Maps links.
- Public business page route `/business/<slug>`.
- Basic service worker app-shell caching.
- SQL schema with RLS and storage policies.

## Online/offline
Online-first. The shell can load while offline after first visit; writes require connection and show errors when unavailable.

## Known constraints
The frontend uses Supabase anon key as intended; RLS is mandatory. Do not disable RLS.
