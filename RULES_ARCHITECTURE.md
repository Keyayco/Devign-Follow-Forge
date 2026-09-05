# RULES_ARCHITECTURE

Permanent technical and product rules for Devign FollowForge. These do not change per session.

## Product rule

One problem only: local service businesses forget to follow up on enquiries and quotes, and
lose the job. Everything in the app serves the question "who do I need to follow up with today?".

Do NOT add: AI chatbot, CRM integrations, email automation, WhatsApp API, accounts, teams,
payments, subscriptions, notifications, backend, cloud database, calendar integration,
analytics dashboards, complex reporting. Those are future versions.

## Stack rules (non-negotiable)

- HTML, CSS, vanilla JS only.
- No frameworks, no TypeScript, no build system, no package manager, no dependencies, no backend.
- Must remain a static site hostable on GitHub Pages / Netlify / Vercel.
- Storage is `localStorage` only.

## File structure

```
index.html
styles.css
app.js
README.md
RULES_ARCHITECTURE.md  STATE.md  HANDOVER.md  LOGS_BUGS.md
assets/                (only if actually needed)
```

Do not add files without a reason.

## Data model

```js
lead = {
  id, customerName, phone, service, enquiry, source,
  status,            // one of STATUSES
  quoteAmount,       // number | null
  quoteDate,         // 'YYYY-MM-DD' | ''
  followUpDate,      // 'YYYY-MM-DD' | ''
  notes,             // [{ date: 'YYYY-MM-DD', text }] append-only
  createdAt, updatedAt   // ISO strings
}
```

Required on create: customerName, phone, service, enquiry. Everything else optional.

Statuses, exactly: `NEW, CONTACTED, QUOTED, FOLLOW-UP, WON, LOST`. No extra stages.

localStorage keys: `followforge.leads.v1`, `followforge.settings.v1`, `followforge.seeded.v1`.
Bump the version suffix if the shape changes incompatibly.

## Dates

Dates are plain `YYYY-MM-DD` strings compared lexicographically against `todayISO()` — no
timezone maths, no Date parsing of stored values. `dueBucket()` returns
`overdue | today | upcoming | none`.

## WhatsApp

`wa.me` deep links only. Never claim automated sending; the user presses Send. Phone
normalisation is SA-first: strip non-digits, `00` prefix dropped, leading `0` becomes `27`.

## Code organisation in app.js

Keep the section order and keep functions small:
constants -> utils -> storage/state -> demo data -> whatsapp -> rendering -> view/modals ->
events -> init. Rendering functions must not mutate state; event handlers mutate then re-render.

Always `escapeHtml()` user-entered values used in template strings.

## UX rules

Priority order: follow-ups due today > overdue > leads > quotes > pipeline > settings.
Mobile-first from 360px, 48px minimum tap targets, no horizontal overflow, useful empty
states everywhere, confirm before destructive actions.
