# HANDOVER

Instructions for the next AI working on Devign FollowForge.

## Read first

1. `RULES_ARCHITECTURE.md` — permanent rules. The stack constraints are non-negotiable.
2. `STATE.md` — what is currently built.
3. `LOGS_BUGS.md` — decisions already made and approaches already rejected.

## How to work on this project

- Open `index.html` directly, or `python3 -m http.server 8000` in the repo root. There is
  no build, no install, no test runner.
- Three files carry the app: `index.html` (markup for every view and modal),
  `styles.css`, `app.js`. Find the relevant section comment in `app.js` before editing.
- Adding a UI action: put a `data-*` attribute on the element and handle it in
  `handleGlobalClick` — do not attach one-off listeners to list items, they are re-rendered.
- After mutating state, call `saveLeads()`/`saveSettings()` then `renderAll()`.
- Verify by hand at 360px width before declaring anything done: add a lead, set a
  follow-up date in the past, confirm it appears under Overdue, refresh, confirm it persists.

## Where things live in app.js

| Need | Function |
|---|---|
| Date bucketing | `dueBucket`, `todayISO`, `shiftDays` |
| Persistence | `loadLeads`, `saveLeads`, `loadSettings`, `saveSettings` |
| Create/update | `upsertLead`, `addNote`, `setStatus`, `deleteLead` |
| WhatsApp | `toWaNumber`, `fillTemplate`, `waLink`, `openWaModal` |
| Screens | `renderDashboard`, `renderFollowUps`, `renderLeads`, `renderPipeline`, `renderDetail` |
| Navigation | `setView`, `openModal`, `closeModal`, `openLeadForm` |

## Sensible next steps (only if asked)

- Export/import leads as a JSON file (still no backend).
- Per-lead follow-up reminder cadence suggestions (e.g. "+3 days" quick buttons).
- Sort options on the Leads list.

Do not start any of these without the owner asking. Do not add scope.

## Before finishing a session

Update `STATE.md`, `HANDOVER.md` and `LOGS_BUGS.md` with anything that affects future work.
Keep conversation chatter out of them.
