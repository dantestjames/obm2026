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
    }));
  }

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
      const cell = document.createElement("div");
      cell.className = "day-cell" + (dayEvents.length ? " has-events" : "") +
        (dow === 0 || dow === 6 ? " weekend" : "");
      cell.dataset.date = d;

      const num = document.createElement("div");
      num.className = "day-num";
      num.textContent = day;
      cell.appendChild(num);

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
    chip.className = "chip status-" + ev.status;
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
    wrap.innerHTML = "";
    if (!list.length) {
      wrap.innerHTML = `<p class="de-empty">No events on this day${anyFilter() ? " (matching filters)" : ""}. Add one below.</p>`;
    } else {
      list.forEach((ev) => wrap.appendChild(makeDayItem(ev)));
    }
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

    if (id) {
      const ev = events.find((x) => x.id === id);
      Object.assign(ev, data);
    } else {
      data.id = "ev-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
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
  [dayModal, eventModal].forEach((m) =>
    m.addEventListener("click", (e) => { if (e.target === m) hideModal(m); })
  );
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { hideModal(eventModal); hideModal(dayModal); }
  });

  /* ---- Modal utils ---- */
  function showModal(m) { m.hidden = false; document.body.style.overflow = "hidden"; }
  function hideModal(m) {
    m.hidden = true;
    if (eventModal.hidden && dayModal.hidden) document.body.style.overflow = "";
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

  /* ---- Init ---- */
  populateControls();
  render();
})();
