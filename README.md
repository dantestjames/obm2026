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

## Flat-file database & text import

Click **Data & import** in the header. The text in the box is your flat-file
database — the same format you Export/Save and can paste back in.

- **Apply** parses the box and upserts: each line is matched by **date + title**;
  a matching line **updates** that event, any other line **adds** a new one.
- Tick **Replace all** to clear everything first and load the box as the full set.
- **Export .txt / .json** downloads the database; **Load file…** reads a `.txt`
  or `.json` back into the box for review.
- On Chrome/Edge an **Open local file… / Save to file** row appears (File System
  Access API) so you can keep and re-save a real local `obm-events.txt`.

### Accepted line formats

Pipe format (what Export produces):

```
DATE | TIME | TITLE | TOWN | REGION | OBM THEME | DS CATEGORY | STATUS
2026-10-02 | 08:00 | OBM Keynote | Alice Springs | Central | | | Pending
```

Loose format (like the original program list) also works:

```
OBM Keynote Alice Springs, 2 Oct, 08:00:am Status: Pending
```

Notes: a blank field between pipes keeps the existing value; dates are October
2026; time accepts `8:00am` / `17:30` / `5:30pm` (blank = all day); status is
Pending / Confirmed / Cancelled; lines starting with `#` are ignored.

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
