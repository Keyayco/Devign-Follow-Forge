# Devign FollowForge

Mobile-first follow-up manager for South African local service businesses.

**Don't lose the job because you forgot to follow up.**

FollowForge answers one question the moment you open it: *who do I need to follow up with today?*

## Run it

No build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Deploy by pushing the repo to GitHub Pages, Netlify or Vercel — it is a static site.

## What it does

- **Today** — overdue / due today / upcoming counts, the leads needing attention now, quotes awaiting follow-up, pipeline counts and quoted / pipeline / won value.
- **Follow-ups** — queue grouped into Overdue, Today, Upcoming with a *Follow up on WhatsApp* button on every item.
- **Leads** — search by name, phone or service; filter by status and follow-up date.
- **Pipeline** — leads grouped by the six statuses: NEW, CONTACTED, QUOTED, FOLLOW-UP, WON, LOST.
- **Lead detail** — customer, job, quote, follow-up date, dated notes (append-only), edit / status change / WhatsApp / Won / Lost / delete.
- **Settings** — business name, business WhatsApp number, default message and the three editable templates.

## WhatsApp

There is no WhatsApp API integration and no automated sending. The button builds a `wa.me`
link with a pre-filled, editable message (SA numbers like `082 555 1234` are converted to
`27821234567`). WhatsApp opens with the text ready — you press Send.

## Storage

Everything lives in the browser's `localStorage`:

- `followforge.leads.v1`
- `followforge.settings.v1`
- `followforge.seeded.v1`

Demo data is seeded on first open so the app is useful immediately. Reload or clear it in Settings.

## Files

```
index.html   markup for all views and modals
styles.css   mobile-first styles (360px up)
app.js       state, storage, rendering, events, WhatsApp helpers
```

`RULES_ARCHITECTURE.md`, `STATE.md`, `HANDOVER.md` and `LOGS_BUGS.md` are the AI handover
source-of-truth files — read them before making substantial changes.
