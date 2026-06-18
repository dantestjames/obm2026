# October Business Month 2026 — Event Calendar

A single-page calendar web app for **October 2026**, styled after the
[October Business Month NT](https://obm.nt.gov.au/) brand (deep navy + coral,
serif display type).

## Features

- Month grid for October 2026 — click any date to add an event.
- Multiple events per day, sorted by start time.
- Each event records:
  - **Title**
  - **OBM theme** — *Adapting* / *Evolving* / *Shifting* (from the OBM form)
  - **Digital Solutions category**
  - **Region** — NT regions: Barkly, Big Rivers, Central, East Arnhem, Top End, Online
  - **Town**
  - **Start time** and **Status** (Pending / Confirmed / Cancelled)
- Click an event to view, edit or delete it.
- Filter the calendar by region, OBM theme or status.
- All data is stored in your browser via `localStorage`. "Reset to default
  events" restores the original prepopulated list.

## Running

No build step or server required — just open `index.html` in a browser:

```bash
# from this folder
xdg-open index.html      # Linux
open index.html          # macOS
```

Or serve it locally:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Prepopulated events

The calendar ships with the 16 OBM 2026 events provided, all marked
*Pending*. Regions are inferred from each town (Alice Springs → Central,
Katherine → Big Rivers, Darwin / Palmerston → Top End) and can be edited.
OBM theme and Digital Solutions category are left blank on the seed events
and can be set per event.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Markup and modals |
| `styles.css` | OBM-styled theme |
| `app.js` | Calendar rendering, event CRUD, persistence |
