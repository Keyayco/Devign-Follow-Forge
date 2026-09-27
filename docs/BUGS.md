# Bugs / Known Issues

- Supabase schema must be applied before live CRUD works.
- Browser PDF rendering depends on jsPDF and may need layout tuning for very long quote notes.
- Photo upload support is schema/policy-ready; UI compression/upload is intentionally basic and should be expanded after device testing.
- Public reviews are not implemented; public page reserves copy for future reviews if added.
- Offline support is app-shell only. Offline writes are not queued.
