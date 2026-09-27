# Handoff

## How to continue
1. Read `docs/SOURCE_OF_TRUTH.md` first.
2. Check `supabase/schema.sql` before changing data access.
3. Keep frontend vanilla JS; do not introduce React or a framework unless product direction changes.
4. Add future paid integrations behind adapter modules so current free flows remain intact.

## Important rules
- Do not expose service role keys.
- Do not rely on frontend filtering for security.
- Keep all tenant data tied to `business_id`.
- Use RLS policies for every table and storage path.
- Keep offline strategy simple until real user demand proves sync is needed.

## Suggested next improvements
- Better route-specific skeleton loading states.
- More robust image upload progress.
- CSV export using Blob downloads.
- Team invites with role management.
- Optional payment link provider adapters.
