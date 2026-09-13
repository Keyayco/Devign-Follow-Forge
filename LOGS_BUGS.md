# LOGS_BUGS

Bugs, fixes, decisions and rejected approaches. Newest first.

## 2026-09-05 — V1 build

### Decisions

- **Dates as strings.** Follow-up and quote dates are stored as `YYYY-MM-DD` and compared
  lexicographically. Rejected `new Date(...)` comparisons: parsing a date-only string is
  UTC-based, which put SAST users one day out around midnight.
- **Single delegated click handler.** Lists are re-rendered as HTML strings, so per-element
  listeners would leak or go stale. Everything routes through `handleGlobalClick` and
  `data-*` attributes. Detail-modal controls are the exception — they are bound inside
  `renderDetail` because that markup is rebuilt with fresh state each time it opens.
- **WON/LOST clears `followUpDate`.** Otherwise closed leads kept appearing in the queue.
  The follow-up buckets additionally filter to `OPEN_STATUSES` as a second guard.
- **Seed flag separate from lead data.** `followforge.seeded.v1` means "Clear all data"
  leaves the app genuinely empty after a refresh instead of re-seeding demo leads.
- **Card click vs. button click.** The whole lead card carries `data-open`; the WhatsApp
  button inside it is checked first in the handler and stops propagation, so tapping it
  does not also open the detail sheet.
- **Phone normalisation is SA-first.** `082 555 1234` -> `27821234567`. Numbers already in
  international form pass through; a leading `00` is stripped.

### Rejected

- WhatsApp Web API / any sending automation — spec forbids it, and it would need a backend.
- Drag-and-drop pipeline board — poor on a 360px touch screen; status changes happen in the
  detail sheet instead.
- A separate Quotes screen — quotes needing follow-up are a dashboard section, which keeps
  the "one screen tells you what matters" promise.

### Known limitations

- Data is per-browser. Clearing site data loses everything; there is no export yet.
- No timezone handling beyond the device's local date.
