# Architecture

## 1. Architecture

Mobile browser/PWA → Vanilla JS app → Supabase client SDK → Supabase Auth/PostgreSQL/Storage.

The MVP intentionally stays frontend-only for R0 hosting. Security is enforced with Supabase Auth, RLS and Storage policies rather than frontend filtering. No service-role key is used client-side.

### Key modules
- `src/app.js`: routing, state, Supabase calls, workflows and UI rendering.
- `src/styles.css`: mobile-first SaaS styling.
- `public/sw.js`: cached shell service worker.
- `public/manifest.webmanifest`: PWA manifest.
- `supabase/schema.sql`: database, RLS and storage policies.

## 2. Database schema

Tables:
- `businesses`: profile, public slug, VAT settings.
- `business_members`: maps auth users to businesses and roles.
- `customers`: customer details and photos.
- `leads`: lead pipeline, source, value, photos.
- `quotes`: quote header, totals, VAT/deposit.
- `quote_items`: quote line items.
- `follow_ups`: quote follow-up workflow.
- `jobs`: accepted quote/job calendar tracking.
- `payments`: payment tracking only.
- `message_templates`: editable WhatsApp templates.
- `activity_logs`: audit/customer history timeline.

All tenant-owned rows include `business_id`. RLS allows access only when `auth.uid()` is in `business_members` for that business.

## 3. Repository/file structure

```text
index.html
src/
  app.js
  styles.css
public/
  manifest.webmanifest
  sw.js
  icons/
supabase/
  schema.sql
  seed.sql
docs/
  SOURCE_OF_TRUTH.md
  ARCHITECTURE.md
  STATE.md
  HANDOFF.md
  DEV_LOG.md
  BUGS.md
.env.example
README.md
contractor-lead-to-cash.zip
```

## 4. Development plan

Order followed:
1. Auth + business setup
2. Dashboard
3. Customers
4. Leads
5. Quotes
6. PDF
7. WhatsApp actions
8. Follow-ups
9. Jobs/calendar
10. Payments
11. Message templates
12. Public business page
13. PWA installation
14. Basic caching

## 5. R0 risks

- Supabase free tier quotas may be exceeded by real production usage.
- Supabase free projects may pause after inactivity.
- Domains are not free unless using platform subdomains.
- WhatsApp/Google Maps links are free but do not provide automation or usage analytics.
- Browser PDF generation can vary by device/browser for very large quotes.
