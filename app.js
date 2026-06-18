/* ============================================================
   October Business Month 2026 — Calendar app logic
   Pure vanilla JS, persists to localStorage.
   ============================================================ */
(function () {
  "use strict";

  const YEAR = 2026;
  const MONTH = 9; // October (0-indexed)
  const STORAGE_KEY = "obm2026-events-v1";

  /* ---- Reference data (from the OBM registration form screenshots) ---- */
  const OBM_THEMES = [
    { value: "Adapting", bold: "Adapting", rest: "to rapid technology advancements" },
    { value: "Evolving", bold: "Evolving", rest: "workplace dynamics" },
    { value: "Shifting", bold: "Shifting", rest: "market demands" },
  ];

  // NT regions (from the "Region" dropdown screenshot)
  const REGIONS = ["Barkly", "Big Rivers", "Central", "East Arnhem", "Top End", "Online"];

  // Digital Solutions categories (OBM Digital Solutions program streams)
  const DS_CATEGORIES = [
    { value: "Introduction to Digitalising Your Small Business",
      desc: "Basics of getting your business online, business planning, and foundational digital strategies." },
    { value: "Social Media, Digital Marketing, and Selling Online",
      desc: "Guidance on social media strategies, SEO, e-commerce, and digital advertising to reach new customers." },
    { value: "Using Business Software",
      desc: "Tips on selecting and integrating software for accounting, inventory, and Customer Relationship Management (CRM)." },
    { value: "AI and Emerging Technologies",
      desc: "Utilizing automation and artificial intelligence tools to streamline business operations." },
    { value: "Cybersecurity and Data Privacy",
      desc: "Protecting customer data, setting up secure payment systems, and understanding online privacy obligations." },
  ];

  // Helper: map a town to its NT region so the seed data is consistent.
  const TOWN_REGION = {
    "Alice Springs": "Central",
    "Katherine": "Big Rivers",
    "Darwin": "Top End",
    "Palmerston": "Top End",
  };

  /* ---- Seed events (prepopulated). time is 24h "HH:MM" or "" ---- */
  const SEED = [
    { day: 2,  time: "08:00", title: "OBM Keynote", town: "Alice Springs" },
    { day: 2,  time: "17:30", title: "Manbulloo Pastures and Palettes", town: "Katherine" },
    { day: 7,  time: "16:00", title: "Doing Business with Government", town: "Katherine" },
    { day: 8,  time: "09:00", title: "Beetaloo Ready", town: "Darwin" },
    { day: 9,  time: "08:00", title: "OBM Keynote", town: "Darwin" },
    { day: 9,  time: "17:30", title: "Dinner, Dust and Dreams", town: "Katherine" },
    { day: 13, time: "17:00", title: "Rules and Regulations - Know Your Obligations and Your Rights", town: "Katherine" },
    { day: 14, time: "09:00", title: "From Stressed to Steady: Skills to Stay Calm at Work and in Life", town: "Palmerston" },
    { day: 14, time: "13:00", title: "Leading Well: Evidence-Based Self-Care for Today's Leaders", town: "Palmerston" },
    { day: 14, time: "14:00", title: "Festival of Women", town: "Katherine" },
    { day: 16, time: "08:00", title: "OBM Keynote", town: "Katherine" },
    { day: 20, time: "09:59", title: "Workforce Vocational Education and Training (VET) Employer Roundtable", town: "Katherine" },
    { day: 21, time: "09:00", title: "The Pivot Room", town: "Darwin" },
    { day: 22, time: "17:30", title: "Sustainable Supply Chains (Katherine Agriculture)", town: "Katherine" },
    { day: 26, time: "13:30", title: "Calm Under Pressure", town: "Katherine" },
    { day: 30, time: "08:00", title: "OBM Keynote", town: "Darwin" },
  ];

  function buildSeed() {
    return SEED.map((e, i) => ({
      id: "seed-" + i,
      date: dateStr(e.day),
      time: e.time,
      title: e.title,
      town: e.town,
      region: TOWN_REGION[e.town] || "",
      obmTheme: "",
      dsCategory: "",
      status: "Pending",
      source: "import",
    }));
  }

  /* ---- Blocked dates: closed to manual entry via the interface ----
     (the import tool can still place events on these dates) ---------- */
  const BLOCKED_DAYS = [11, 12, 13, 14, 15];
  const BLOCKED_DATES = new Set(BLOCKED_DAYS.map(dateStr));
  function isBlocked(d) { return BLOCKED_DATES.has(d); }

  /* ---- State ---- */
  let events = load();

  /* ---- DOM ---- */
  const $ = (s) => document.querySelector(s);
  const calendarEl = $("#calendar");
  const dayModal = $("#dayModal");
  const eventModal = $("#eventModal");
  const form = $("#eventForm");

  /* ---- Persistence ---- */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* ignore */ }
    return buildSeed();
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch (e) {}
  }

  /* ---- Date helpers ---- */
  function dateStr(day) {
    return `${YEAR}-${String(MONTH + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  function fmtTime(t) {
    if (!t) return "All day";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "pm" : "am";
    const h12 = ((h + 11) % 12) + 1;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  }
  function sortEvents(list) {
    return list.slice().sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));
  }
  function eventsForDate(d) {
    return sortEvents(events.filter((e) => e.date === d && passesFilter(e)));
  }

  /* ---- Filters ---- */
  const filterRegion = $("#filterRegion");
  const filterCategory = $("#filterCategory");
  const filterStatus = $("#filterStatus");

  function passesFilter(e) {
    if (filterRegion.value && e.region !== filterRegion.value) return false;
    if (filterCategory.value && e.obmTheme !== filterCategory.value) return false;
    if (filterStatus.value && e.status !== filterStatus.value) return false;
    return true;
  }

  /* ---- Populate selects / radios ---- */
  function populateControls() {
    REGIONS.forEach((r) => {
      filterRegion.add(new Option(r, r));
      $("#f_region").add(new Option(r, r));
    });
    OBM_THEMES.forEach((t) => filterCategory.add(new Option(t.value + " — " + t.rest, t.value)));

    const dsSel = $("#f_ds");
    dsSel.add(new Option("— None —", ""));
    DS_CATEGORIES.forEach((c) => {
      const opt = new Option(c.value, c.value);
      opt.title = c.desc; // hover description
      dsSel.add(opt);
    });

    const regSel = $("#f_region");
    regSel.insertBefore(new Option("— Please select —", ""), regSel.firstChild);
    regSel.value = "";

    const obmWrap = $("#f_obm_options");
    obmWrap.innerHTML =
      `<label class="radio-opt"><input type="radio" name="obmTheme" value=""><span>— None —</span></label>` +
      OBM_THEMES.map(
        (t) =>
          `<label class="radio-opt"><input type="radio" name="obmTheme" value="${t.value}">` +
          `<span><b>${t.bold}</b> ${t.rest}</span></label>`
      ).join("");
  }

  /* ---- Render calendar ---- */
  function render() {
    calendarEl.innerHTML = "";
    const first = new Date(YEAR, MONTH, 1);
    // JS getDay(): 0=Sun..6=Sat. We start the grid on Monday.
    let lead = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(YEAR, MONTH + 1, 0).getDate();

    for (let i = 0; i < lead; i++) {
      const cell = document.createElement("div");
      cell.className = "day-cell empty";
      calendarEl.appendChild(cell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = dateStr(day);
      const dayEvents = eventsForDate(d);
      const dow = new Date(YEAR, MONTH, day).getDay();
      const blocked = isBlocked(d);
      const cell = document.createElement("div");
      cell.className = "day-cell" + (dayEvents.length ? " has-events" : "") +
        (dow === 0 || dow === 6 ? " weekend" : "") + (blocked ? " blocked" : "");
      cell.dataset.date = d;

      const num = document.createElement("div");
      num.className = "day-num";
      num.textContent = day;
      cell.appendChild(num);
      if (blocked) {
        const flag = document.createElement("span");
        flag.className = "blocked-flag";
        flag.textContent = "Closed";
        flag.title = "Closed to new entries via the interface";
        cell.appendChild(flag);
      }

      const shown = dayEvents.slice(0, 3);
      shown.forEach((ev) => cell.appendChild(makeChip(ev)));
      if (dayEvents.length > 3) {
        const more = document.createElement("button");
        more.className = "more-link";
        more.textContent = `+${dayEvents.length - 3} more`;
        more.addEventListener("click", (e) => { e.stopPropagation(); openDay(d); });
        cell.appendChild(more);
      }

      cell.addEventListener("click", () => openDay(d));
      calendarEl.appendChild(cell);
    }
  }

  function makeChip(ev) {
    const chip = document.createElement("button");
    chip.className = "chip status-" + ev.status + (ev.source === "manual" ? " manual" : "");
    chip.innerHTML =
      `<span class="chip-time">${ev.time ? fmtTime(ev.time) : "All day"}</span>` +
      `<span class="chip-title">${escapeHtml(ev.title)}</span>`;
    chip.addEventListener("click", (e) => { e.stopPropagation(); openEditor(ev.id, ev.date); });
    return chip;
  }

  /* ---- Day modal ---- */
  let activeDate = null;
  function openDay(d) {
    activeDate = d;
    const list = eventsForDate(d);
    $("#dayModalTitle").textContent = prettyDate(d);
    const wrap = $("#dayEventList");
    const blocked = isBlocked(d);
    wrap.innerHTML = "";
    if (blocked) {
      const note = document.createElement("p");
      note.className = "day-closed";
      note.textContent = "This date is closed to new entries through the interface. Events can still be added here via the Data & import tool.";
      wrap.appendChild(note);
    }
    if (!list.length) {
      const p = document.createElement("p");
      p.className = "de-empty";
      p.textContent = `No events on this day${anyFilter() ? " (matching filters)" : ""}.` + (blocked ? "" : " Add one below.");
      wrap.appendChild(p);
    } else {
      list.forEach((ev) => wrap.appendChild(makeDayItem(ev)));
    }
    $("#addForDayBtn").style.display = blocked ? "none" : "";
    showModal(dayModal);
  }

  function makeDayItem(ev) {
    const item = document.createElement("div");
    item.className = "de-item";
    const tags = [];
    if (ev.region) tags.push(`<span class="tag region">${escapeHtml(ev.region)}${ev.town ? " · " + escapeHtml(ev.town) : ""}</span>`);
    else if (ev.town) tags.push(`<span class="tag region">${escapeHtml(ev.town)}</span>`);
    if (ev.obmTheme) tags.push(`<span class="tag obm">${escapeHtml(ev.obmTheme)}</span>`);
    if (ev.dsCategory) tags.push(`<span class="tag ds">${escapeHtml(ev.dsCategory)}</span>`);
    tags.push(`<span class="tag status-${ev.status}">${ev.status}</span>`);
    item.innerHTML =
      `<div class="de-time">${ev.time ? fmtTime(ev.time) : "All day"}</div>` +
      `<div class="de-body"><h3>${escapeHtml(ev.title)}</h3><div class="de-meta">${tags.join("")}</div></div>`;
    item.addEventListener("click", () => openEditor(ev.id, ev.date));
    return item;
  }

  /* ---- Event editor ---- */
  function openEditor(id, dateForNew) {
    form.reset();
    const editing = events.find((e) => e.id === id);
    $("#eventModalTitle").textContent = editing ? "Edit event" : "Add event";
    $("#deleteEventBtn").hidden = !editing;
    $("#eventFormMsg").hidden = true;

    $("#eventId").value = editing ? editing.id : "";
    $("#f_title").value = editing ? editing.title : "";
    $("#f_date").value = editing ? editing.date : (dateForNew || dateStr(1));
    $("#f_time").value = editing ? editing.time : "";
    $("#f_region").value = editing ? editing.region : "";
    $("#f_town").value = editing ? editing.town : "";
    $("#f_ds").value = editing ? (editing.dsCategory || "") : "";
    $("#f_status").value = editing ? editing.status : "Pending";

    const theme = editing ? editing.obmTheme || "" : "";
    const radio = form.querySelector(`input[name="obmTheme"][value="${theme}"]`);
    if (radio) radio.checked = true;

    showModal(eventModal);
    $("#f_title").focus();
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const id = $("#eventId").value;
    const data = {
      title: $("#f_title").value.trim(),
      date: $("#f_date").value,
      time: $("#f_time").value,
      region: $("#f_region").value,
      town: $("#f_town").value.trim(),
      obmTheme: (form.querySelector('input[name="obmTheme"]:checked') || {}).value || "",
      dsCategory: $("#f_ds").value,
      status: $("#f_status").value,
    };
    if (!data.title || !data.date || !data.region) return;

    const existing = id ? events.find((x) => x.id === id) : null;
    // Blocked dates are closed to the interface: refuse to add a new event,
    // or to move an event onto a blocked date it wasn't already on.
    if (isBlocked(data.date) && !(existing && existing.date === data.date)) {
      const msg = $("#eventFormMsg");
      msg.textContent = `${prettyDate(data.date)} is closed to new entries. Use the Data & import tool to add events on this date.`;
      msg.hidden = false;
      return;
    }

    if (existing) {
      Object.assign(existing, data);
    } else {
      data.id = "ev-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      data.source = "manual";
      events.push(data);
    }
    save();
    render();
    hideModal(eventModal);
    if (activeDate) {
      if (eventsForDate(activeDate).length) openDay(activeDate);
      else hideModal(dayModal);
    }
  });

  $("#deleteEventBtn").addEventListener("click", () => {
    const id = $("#eventId").value;
    if (!id) return;
    if (!confirm("Delete this event?")) return;
    events = events.filter((e) => e.id !== id);
    save();
    render();
    hideModal(eventModal);
    if (activeDate) {
      if (eventsForDate(activeDate).length) openDay(activeDate);
      else hideModal(dayModal);
    }
  });

  /* ---- Buttons / wiring ---- */
  $("#addEventBtn").addEventListener("click", () => { activeDate = null; openEditor(null, dateStr(1)); });
  $("#addForDayBtn").addEventListener("click", () => openEditor(null, activeDate || dateStr(1)));
  [filterRegion, filterCategory, filterStatus].forEach((el) =>
    el.addEventListener("change", render)
  );
  $("#resetData").addEventListener("click", () => {
    if (!confirm("Restore the original prepopulated events? This replaces your current events.")) return;
    events = buildSeed();
    save();
    render();
  });

  document.querySelectorAll("[data-close]").forEach((btn) =>
    btn.addEventListener("click", () => hideModal($("#" + btn.dataset.close)))
  );
  const dataModal = $("#dataModal");
  [dayModal, eventModal, dataModal].forEach((m) =>
    m.addEventListener("click", (e) => { if (e.target === m) hideModal(m); })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { hideModal(eventModal); hideModal(dayModal); hideModal(dataModal); }
  });

  /* ---- Modal utils ---- */
  function showModal(m) { m.hidden = false; document.body.style.overflow = "hidden"; }
  function hideModal(m) {
    m.hidden = true;
    if (eventModal.hidden && dayModal.hidden && dataModal.hidden) document.body.style.overflow = "";
  }

  /* ---- Misc helpers ---- */
  function anyFilter() { return !!(filterRegion.value || filterCategory.value || filterStatus.value); }
  function prettyDate(d) {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ============================================================
     Flat-file text database — import (paste / file) & export
     ============================================================ */
  const MONTHS = { jan:1, feb:2, mar:3, apr:4, may:5, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12 };
  function pad(n) { return String(n).padStart(2, "0"); }

  // Towns we recognise (seed map + any towns already entered) — used to split
  // "Title Town" in the loose paste format.
  function knownTowns() {
    const set = new Set(Object.keys(TOWN_REGION));
    events.forEach((e) => { if (e.town) set.add(e.town); });
    return [...set].sort((a, b) => b.length - a.length);
  }

  function parseDateField(raw) {
    const s = (raw || "").trim();
    if (!s) return null;
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const lower = s.toLowerCase();
    const dayM = lower.match(/\b(\d{1,2})\b/);
    if (!dayM) return null;
    const day = parseInt(dayM[1], 10);
    if (day < 1 || day > 31) return null;
    let month = MONTH + 1;                 // default October
    const monM = lower.match(/[a-z]{3,9}/);
    if (monM && MONTHS[monM[0].slice(0, 3)]) month = MONTHS[monM[0].slice(0, 3)];
    let year = YEAR;
    const yearM = lower.match(/\b(20\d{2})\b/);
    if (yearM) year = parseInt(yearM[1], 10);
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  function parseTimeField(raw) {
    let s = (raw || "").trim().toLowerCase();
    if (!s) return "";                     // blank = all day
    s = s.replace(/\s+/g, "").replace(/:(am|pm)$/, "$1"); // "08:00:am" -> "08:00am"
    const m = s.match(/^(\d{1,2})(?:[:.](\d{2}))?(am|pm)?$/);
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = m[2] ? parseInt(m[2], 10) : 0;
    if (h > 23 || min > 59) return null;
    if (m[3] === "am" && h === 12) h = 0;
    else if (m[3] === "pm" && h !== 12) h += 12;
    return `${pad(h)}:${pad(min)}`;
  }

  function normStatus(raw) {
    const s = (raw || "").trim().toLowerCase();
    if (s.startsWith("pend")) return "Pending";
    if (s.startsWith("conf")) return "Confirmed";
    if (s.startsWith("canc")) return "Cancelled";
    return "";
  }
  function normTheme(raw) {
    const s = (raw || "").trim().toLowerCase();
    if (!s) return "";
    const t = OBM_THEMES.find((x) => s.startsWith(x.value.toLowerCase()));
    return t ? t.value : "";
  }
  function normRegion(raw) {
    const s = (raw || "").trim();
    if (!s) return "";
    return REGIONS.find((r) => r.toLowerCase() === s.toLowerCase()) || s;
  }
  function normDs(raw) {
    const s = (raw || "").trim();
    if (!s) return "";
    const hit = DS_CATEGORIES.find(
      (c) => c.value.toLowerCase() === s.toLowerCase() ||
             c.value.toLowerCase().startsWith(s.toLowerCase())
    );
    return hit ? hit.value : s;
  }
  function splitTitleTown(text) {
    const t = text.trim();
    for (const town of knownTowns()) {
      const re = new RegExp("\\s+" + town.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$", "i");
      if (re.test(t)) return { title: t.replace(re, "").trim(), town };
    }
    return { title: t, town: "" };
  }

  // Parse one line -> {data} | {error} | null (skip)
  function parseLine(line) {
    const raw = line.trim();
    if (!raw || raw.startsWith("#")) return null;
    let date, time, title, town, region, theme, ds, status;

    if (raw.includes("|")) {
      const f = raw.split("|").map((x) => x.trim());
      date = parseDateField(f[0]);
      time = parseTimeField(f[1] || "");
      title = (f[2] || "").trim();
      town = (f[3] || "").trim();
      region = normRegion(f[4] || "");
      theme = normTheme(f[5] || "");
      ds = normDs(f[6] || "");
      status = normStatus(f[7] || "");
      if (!date) return { error: "bad or missing date" };
      if (!title) return { error: "missing title" };
      if (time === null) return { error: "bad time" };
    } else {
      const parts = raw.split(",");
      if (parts.length < 2) return { error: "unrecognised line" };
      const tt = splitTitleTown(parts[0]);
      title = tt.title; town = tt.town;
      date = parseDateField(parts[1]);
      let rest = parts.slice(2).join(",");
      const stM = rest.match(/status\s*:\s*([a-z]+)/i);
      status = stM ? normStatus(stM[1]) : "";
      if (stM) rest = rest.replace(stM[0], "");
      time = parseTimeField(rest);
      region = ""; theme = ""; ds = "";
      if (!date) return { error: "bad or missing date" };
      if (!title) return { error: "missing title" };
      if (time === null) time = "";        // lenient in loose mode
    }
    return { data: { date, time, title, town, region, theme, ds, status } };
  }

  function applyText(text, replace) {
    const parsed = [];
    const errors = [];
    text.split(/\r?\n/).forEach((ln, i) => {
      const r = parseLine(ln);
      if (r === null) return;
      if (r.error) { errors.push(`Line ${i + 1}: ${r.error}`); return; }
      parsed.push(r.data);
    });
    if (!parsed.length && !replace) return { added: 0, updated: 0, errors, empty: true };

    if (replace) events.length = 0;
    const keyOf = (d, t) => d + "" + t.trim().toLowerCase();
    const map = new Map();
    events.forEach((e) => map.set(keyOf(e.date, e.title), e));

    let added = 0, updated = 0;
    parsed.forEach((p) => {
      const ex = map.get(keyOf(p.date, p.title));
      if (ex) {
        if (p.time !== "") ex.time = p.time;
        if (p.town) ex.town = p.town;
        if (p.region) ex.region = p.region;
        if (p.theme) ex.obmTheme = p.theme;
        if (p.ds) ex.dsCategory = p.ds;
        if (p.status) ex.status = p.status;
        updated++;
      } else {
        const ev = {
          id: "ev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
          date: p.date, time: p.time, title: p.title.trim(),
          town: p.town, region: p.region || TOWN_REGION[p.town] || "",
          obmTheme: p.theme, dsCategory: p.ds, status: p.status || "Pending",
          source: "import",
        };
        events.push(ev);
        map.set(keyOf(ev.date, ev.title), ev);
        added++;
      }
    });
    save();
    render();
    return { added, updated, errors };
  }

  // Serialise the whole DB to the canonical pipe text (== the flat file).
  function serializeText(list) {
    const header = "# OBM 2026 events — DATE | TIME | TITLE | TOWN | REGION | OBM THEME | DS CATEGORY | STATUS";
    const rows = list
      .slice()
      .sort((a, b) => (a.date + (a.time || "99:99")).localeCompare(b.date + (b.time || "99:99")))
      .map((e) => [e.date, e.time || "", e.title, e.town || "", e.region || "",
        e.obmTheme || "", e.dsCategory || "", e.status || "Pending"].join(" | "));
    return [header, ...rows].join("\n") + "\n";
  }

  function download(filename, text, mime) {
    const blob = new Blob([text], { type: mime || "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // JSON file? convert to the editor's pipe text; otherwise pass through.
  function toEditorText(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        const data = JSON.parse(trimmed);
        if (Array.isArray(data)) return serializeText(data.map(normalizeImported));
      } catch (e) { /* fall through */ }
    }
    return text;
  }
  function normalizeImported(o) {
    return {
      date: o.date, time: o.time || "", title: o.title || "",
      town: o.town || "", region: o.region || "",
      obmTheme: o.obmTheme || o.theme || "", dsCategory: o.dsCategory || o.ds || "",
      status: o.status || "Pending",
    };
  }

  function setupDataModule() {
    const dataText = $("#dataText");
    const msgEl = $("#dataMsg");
    const setMsg = (t, kind) => { msgEl.textContent = t; msgEl.className = "data-msg" + (kind ? " " + kind : ""); };

    $("#dataBtn").addEventListener("click", () => {
      dataText.value = serializeText(events);
      setMsg("");
      showModal(dataModal);
    });
    $("#loadCurrentBtn").addEventListener("click", () => {
      dataText.value = serializeText(events);
      setMsg(`Loaded current data (${events.length} events).`, "ok");
    });
    $("#applyTextBtn").addEventListener("click", () => {
      const replace = $("#replaceAll").checked;
      if (replace && !confirm("Replace ALL existing events with the contents of the box?")) return;
      const res = applyText(dataText.value, replace);
      if (res.empty) { setMsg("No event lines found to apply.", "err"); return; }
      const head = `Applied: ${res.added} added, ${res.updated} updated.`;
      if (res.errors.length) setMsg(head + "\nSkipped:\n" + res.errors.join("\n"), "err");
      else setMsg(head, "ok");
      dataText.value = serializeText(events);   // reflect canonical state
    });
    $("#copyTextBtn").addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(dataText.value); setMsg("Copied to clipboard.", "ok"); }
      catch (e) { dataText.select(); try { document.execCommand("copy"); } catch (_) {} setMsg("Selected — press Cmd/Ctrl+C to copy.", "ok"); }
    });
    $("#exportTxtBtn").addEventListener("click", () => download("obm-events.txt", serializeText(events), "text/plain"));
    $("#exportJsonBtn").addEventListener("click", () => download("obm-events.json", JSON.stringify(events, null, 2), "application/json"));
    $("#importFileBtn").addEventListener("click", () => $("#importFile").click());
    $("#importFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        dataText.value = toEditorText(String(reader.result || ""));
        setMsg(`Loaded "${file.name}" into the box. Review, then click Apply.`, "ok");
      };
      reader.readAsText(file);
      e.target.value = "";
    });

    // File System Access API (Chrome/Edge): a real local flat file to open & save.
    let fileHandle = null;
    if ("showOpenFilePicker" in window && "showSaveFilePicker" in window) {
      $("#dataFsRow").hidden = false;
      $("#openFileBtn").addEventListener("click", async () => {
        try {
          const [h] = await window.showOpenFilePicker({
            types: [{ description: "OBM data", accept: { "text/plain": [".txt"], "application/json": [".json"] } }],
          });
          fileHandle = h;
          dataText.value = toEditorText(await (await h.getFile()).text());
          $("#fsName").textContent = h.name;
          setMsg(`Opened "${h.name}". Review, then Apply (tick "Replace all" for a clean load).`, "ok");
        } catch (err) { if (err.name !== "AbortError") setMsg("Could not open file: " + err.message, "err"); }
      });
      $("#saveFileBtn").addEventListener("click", async () => {
        try {
          if (!fileHandle) {
            fileHandle = await window.showSaveFilePicker({
              suggestedName: "obm-events.txt",
              types: [{ description: "OBM data", accept: { "text/plain": [".txt"] } }],
            });
          }
          const w = await fileHandle.createWritable();
          await w.write(serializeText(events));
          await w.close();
          $("#fsName").textContent = fileHandle.name;
          setMsg(`Saved ${events.length} events to "${fileHandle.name}".`, "ok");
        } catch (err) { if (err.name !== "AbortError") setMsg("Could not save: " + err.message, "err"); }
      });
    }
  }

  /* ---- Init ---- */
  populateControls();
  setupDataModule();
  render();
})();
