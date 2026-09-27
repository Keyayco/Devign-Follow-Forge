# Dev Log

## Initial build
- Replaced React app UI with vanilla HTML/CSS/JS frontend because the requirement explicitly forbids React.
- Kept Vite only as a static dev/build tool.
- Added Supabase client SDK and jsPDF as minimal dependencies.
- Implemented app shell, mobile navigation, auth, business setup and data workflows.
- Added PWA manifest and service worker.
- Added SQL schema with tenant isolation RLS and storage policies.
- Added documentation and ZIP generation.

## Decisions
- Online-first only; no IndexedDB outbox.
- Public business page reads only `is_public = true` business profile data.
- Payments are records only and never process money.
- WhatsApp uses URL links, not automation.
- Google Maps uses query links, not API keys.
