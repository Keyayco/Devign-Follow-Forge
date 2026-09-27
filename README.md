# Contractor Lead-to-Cash PWA

A mobile-first vanilla HTML/CSS/JavaScript PWA for small South African contractors and trades businesses. It supports the workflow:

**Lead → Customer → Quote → Follow-up → Job → Payment → Customer History**

Built for businesses currently working from WhatsApp, calls, paper and spreadsheets.

## Technology

- Vanilla HTML, CSS and JavaScript
- Vite for local dev/static build only
- Supabase Auth + PostgreSQL + Storage
- Browser-side PDF generation with jsPDF
- Installable PWA with service worker
- Standard `wa.me` WhatsApp links
- Normal Google Maps links
- Static hosting compatible with Netlify / Cloudflare Pages / Vercel static output

No React UI, no WhatsApp API, no SMS API, no paid maps, no payment gateway, no paid analytics.

## R0 upfront design

The MVP can be demonstrated on free tiers:

- Supabase free project
- GitHub repository
- Netlify/Cloudflare Pages free static hosting
- WhatsApp `wa.me` links
- Google Maps normal links
- Browser-generated PDFs

Risks: free tiers have limits; Supabase may pause inactive free projects; custom domains may have external DNS/domain costs; SMS/WhatsApp Business/payment processing would be paid future integrations.

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor, or apply equivalent schema through your platform migration flow.
3. In Supabase Auth, enable email/password auth.
4. Copy `.env.example` to `.env` and fill:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

5. Install and run:

```bash
npm install
npm run dev
```

6. Register a user in the app and create your first business.

## Deployment

### Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Add env vars in Netlify site settings.

### Cloudflare Pages
- Build command: `npm run build`
- Output directory: `dist`
- Add env vars in Pages settings.

### GitHub
Push this folder to GitHub. Do not commit `.env`.

## Acceptance journey

Test:
1. Register/login.
2. Create business profile.
3. Add lead.
4. Convert lead to customer.
5. Create quote with line items, VAT and deposit.
6. Generate PDF.
7. Open WhatsApp quote link.
8. Accept quote.
9. Confirm follow-up completed, job created, payment record created.
10. Update job/payment.
11. Open customer history.
12. Open public business page at `/business/<slug>`.
13. Install PWA and verify service worker registration.

## Security

- Uses Supabase Auth sessions.
- RLS policies isolate by `business_members`.
- Storage bucket paths start with `business_id`; policies check business membership.
- No service-role keys or private secrets in browser code.
- POPIA-conscious minimal collection; not a POPIA certification.

## Documentation

See:
- `docs/SOURCE_OF_TRUTH.md`
- `docs/ARCHITECTURE.md`
- `docs/STATE.md`
- `docs/HANDOFF.md`
- `docs/DEV_LOG.md`
- `docs/BUGS.md`
