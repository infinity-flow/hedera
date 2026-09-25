/* =========================================================
   Hedera Cleaning — interakcije i online zakazivanje
   ========================================================= */

/**
 * PODEŠAVANJA
 * - endpoint: URL na koji se šalje zahtev za termin (POST, JSON), npr. Formspree
 *   ("https://formspree.io/f/xxxxxxx"), sopstveni backend ili Make/Zapier webhook.
 *   Ako je prazan, otvara se e-mail klijent sa popunjenom porukom na adresu `email`.
 * - workingDays: radni dani (0 = nedelja, 1 = ponedeljak … 6 = subota).
 * - firstHour / lastHour: prvi i poslednji početak termina (termini na svakih sat vremena).
 * - minLeadHours: koliko sati unapred najranije može da se zakaže današnji termin.
 * - daysAhead: koliko dana unapred je moguće zakazati.
 * - bookedSlots: zauzeti termini, npr. { "2026-10-01": [9, 13] }.
 */
const CONFIG = {
  endpoint: "",
  email: "info@hederacleaning.rs",
  workingDays: [1, 2, 3, 4, 5, 6],
  firstHour: 9,
  lastHour: 16,
  treatmentMinutes: 45,
  minLeadHours: 2,
  daysAhead: 45,
  bookedSlots: {},
};

const MONTHS_GEN = ["januara", "februara", "marta", "aprila", "maja", "juna", "jula", "avgusta", "septembra", "oktobra", "novembra", "decembra"];
const MONTHS_SHORT = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "avg", "sep", "okt", "nov", "dec"];
const WEEKDAYS = ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"];
const WEEKDAYS_SHORT = ["Ned", "Pon", "Uto", "Sre", "Čet", "Pet", "Sub"];

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const pad = (n) => String(n).padStart(2, "0");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const formatDateLong = (d) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS_GEN[d.getMonth()]}`;
const formatTime = (h, m = 0) => `${pad(h)}:${pad(m)}`;
const endOf = (h) => {
  const total = h * 60 + CONFIG.treatmentMinutes;
  return formatTime(Math.floor(total / 60), total % 60);
};
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- Navigacija ---------- */
(function initNav() {
  const nav = $(".nav");
  const toggle = $("#navToggle");
  const sheet = $("#navSheet");
  const scrim = $("#scrim");

  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 4);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    scrim.classList.toggle("is-on", open);
    toggle.setAttribute("aria-expanded", String(open));
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  sheet.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  scrim.addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  $("#year").textContent = new Date().getFullYear();
})();

/* ---------- Pojavljivanje pri skrolovanju (samo veći blokovi) ---------- */
(function initReveal() {
  if (!("IntersectionObserver" in window) || reducedMotion.matches) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".section__head, .steps, .tile, .timeline, .prep, .faq").forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
})();

/* ---------- Magla u kabini (hero) ----------
   Čestice izlaze iz uređaja na podu, lebde i ispunjavaju kabinu vidljivu kroz stakla.
   Kretanje: slučajni hod sa prigušenjem i blagim uzgonom; odbijaju se od ivica kabine. */
(function initFog() {
  const stage = $("#stage");
  const svg = $(".stage__car", stage);
  const canvas = $("#fog");
  if (!canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  const VIEW_W = 1000;
  const VIEW_Y = 96;   // gornja ivica viewBox-a
  const cabin = new Path2D("M262 192 C300 168 338 147 380 139 C430 130 520 131 568 139 C598 150 628 172 652 196 Z");
  const EMIT = { x: 466, y: 190 };
  const MAX = 320;
  const SPAWN_PER_SEC = 70;

  // mekana tačka, iscrtana jednom pa ponovo korišćena
  const sprite = document.createElement("canvas");
  sprite.width = sprite.height = 64;
  const sctx = sprite.getContext("2d");
  const g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(52,199,89,1)");
  g.addColorStop(0.45, "rgba(52,199,89,0.55)");
  g.addColorStop(1, "rgba(52,199,89,0)");
  sctx.fillStyle = g;
  sctx.fillRect(0, 0, 64, 64);

  let scale = 1, dpr = 1;
  let particles = [];
  let spawnDebt = 0;
  let running = false;
  let last = 0;
  let raf = 0;

  function layout() {
    const s = stage.getBoundingClientRect();
    const r = svg.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    scale = r.width / VIEW_W;
    Object.assign(canvas.style, {
      left: `${r.left - s.left}px`, top: `${r.top - s.top}px`,
      width: `${r.width}px`, height: `${r.height}px`,
    });
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
  }

  const inside = (x, y) => {
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, -VIEW_Y * scale * dpr);
    return ctx.isPointInPath(cabin, x * scale * dpr, (y - VIEW_Y) * scale * dpr);
  };

  function spawn() {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const speed = 80 + Math.random() * 160;
    particles.push({
      x: EMIT.x + (Math.random() - 0.5) * 40,
      y: EMIT.y,
      vx: Math.cos(a) * speed * 2.2,
      vy: Math.sin(a) * speed,
      r: 10 + Math.random() * 18,
      a: 0,
      target: 0.035 + Math.random() * 0.05,
    });
  }

  function step(dt) {
    if (particles.length < MAX) {
      spawnDebt += SPAWN_PER_SEC * dt;
      while (spawnDebt >= 1 && particles.length < MAX) { spawn(); spawnDebt -= 1; }
    }
    const damp = Math.pow(0.5, dt);
    for (const p of particles) {
      p.vx = p.vx * damp + (Math.random() - 0.5) * 900 * dt;
      p.vy = p.vy * damp + (Math.random() - 0.5) * 500 * dt;
      const nx = p.x + p.vx * dt;
      const ny = p.y + p.vy * dt;
      if (inside(nx, ny)) { p.x = nx; p.y = ny; }
      else { p.vx *= -0.5; p.vy *= -0.5; }
      p.a += (p.target - p.a) * Math.min(1, dt * 1.5);
    }
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, -VIEW_Y * scale * dpr);
    ctx.clip(cabin);
    for (const p of particles) {
      ctx.globalAlpha = p.a;
      ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    step(dt);
    draw();
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function stop() { running = false; cancelAnimationFrame(raf); }

  function renderStatic() {
    particles = [];
    for (let i = 0; i < 900; i++) step(1 / 60);
    particles.forEach((p) => { p.a = p.target; });
    draw();
  }

  layout();
  new ResizeObserver(() => { layout(); if (!running) draw(); }).observe(stage);

  if (reducedMotion.matches) { renderStatic(); return; }

  // radi samo dok je vidljivo — štedi bateriju
  new IntersectionObserver(([entry]) => (entry.isIntersecting ? start() : stop()), { threshold: 0.15 }).observe(stage);
  document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); });
})();

/* ---------- Zakazivanje ---------- */
(function initBooking() {
  const daysEl = $("#days");
  const daysWrap = $(".days");
  const prevBtn = $("#daysPrev");
  const nextBtn = $("#daysNext");
  const timesEl = $("#times");
  const form = $("#bookingForm");
  const bookingEl = $("#booking");
  const doneEl = $("#done");
  const submitBtn = $("#submitBtn");

  const state = { date: null, hour: null, last: null };

  function availableHours(date) {
    const now = Date.now();
    const booked = CONFIG.bookedSlots[dateKey(date)] || [];
    const hours = [];
    for (let h = CONFIG.firstHour; h <= CONFIG.lastHour; h++) {
      const t = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h).getTime();
      hours.push({ hour: h, available: t - now >= CONFIG.minLeadHours * 3600e3 && !booked.includes(h) });
    }
    return hours;
  }

  function bookableDays() {
    const days = [];
    const d = startOfDay(new Date());
    for (let i = 0; i <= CONFIG.daysAhead; i++) {
      if (CONFIG.workingDays.includes(d.getDay()) && availableHours(d).some((s) => s.available)) {
        days.push(new Date(d));
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  }

  /* dani */
  const days = bookableDays();

  function renderDays() {
    const frag = document.createDocumentFragment();
    days.forEach((date, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "day";
      b.setAttribute("role", "radio");
      b.dataset.index = i;
      b.setAttribute("aria-label", cap(formatDateLong(date)));
      b.innerHTML =
        `<span class="day__wd">${WEEKDAYS_SHORT[date.getDay()]}</span>` +
        `<span class="day__d">${date.getDate()}</span>` +
        `<span class="day__mo">${MONTHS_SHORT[date.getMonth()]}</span>`;
      frag.appendChild(b);
    });
    daysEl.replaceChildren(frag);
    syncDays();
  }

  function syncDays() {
    daysEl.querySelectorAll(".day").forEach((b) => {
      const selected = state.date && days[b.dataset.index].getTime() === state.date.getTime();
      b.setAttribute("aria-checked", String(Boolean(selected)));
      b.tabIndex = selected || (!state.date && b.dataset.index === "0") ? 0 : -1;
    });
  }

  daysEl.addEventListener("click", (e) => {
    const b = e.target.closest(".day");
    if (b) selectDate(days[b.dataset.index]);
  });

  // strelice levo/desno menjaju dan (radio grupa)
  daysEl.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    e.preventDefault();
    const i = days.findIndex((d) => state.date && d.getTime() === state.date.getTime());
    const next = Math.max(0, Math.min(days.length - 1, i + (e.key === "ArrowRight" ? 1 : -1)));
    selectDate(days[next]);
    const btn = daysEl.children[next];
    btn.focus();
    btn.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reducedMotion.matches ? "auto" : "smooth" });
  });

  function updateArrows() {
    const max = daysEl.scrollWidth - daysEl.clientWidth;
    const atStart = daysEl.scrollLeft <= 2;
    const atEnd = daysEl.scrollLeft >= max - 2;
    prevBtn.disabled = atStart;
    nextBtn.disabled = atEnd;
    daysWrap.classList.toggle("at-start", atStart);
    daysWrap.classList.toggle("at-end", atEnd);
  }
  daysEl.addEventListener("scroll", updateArrows, { passive: true });
  window.addEventListener("resize", updateArrows);
  const page = (dir) => daysEl.scrollBy({ left: dir * daysEl.clientWidth * 0.8, behavior: reducedMotion.matches ? "auto" : "smooth" });
  prevBtn.addEventListener("click", () => page(-1));
  nextBtn.addEventListener("click", () => page(1));

  /* vreme */
  function renderTimes() {
    timesEl.replaceChildren();
    if (!state.date) return;
    availableHours(state.date).forEach(({ hour, available }) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "time";
      b.setAttribute("role", "radio");
      b.textContent = formatTime(hour);
      b.disabled = !available;
      b.setAttribute("aria-checked", String(state.hour === hour));
      b.setAttribute("aria-label", available ? `${formatTime(hour)} do ${endOf(hour)}` : `${formatTime(hour)}, zauzeto`);
      b.addEventListener("click", () => selectHour(hour));
      timesEl.appendChild(b);
    });
  }

  function selectDate(date) {
    state.date = date;
    const slot = availableHours(date).find((s) => s.hour === state.hour);
    if (!slot || !slot.available) state.hour = null;
    syncDays();
    renderTimes();
    renderSummary();
  }

  function selectHour(hour) {
    state.hour = hour;
    $("#slotError").hidden = true;
    timesEl.querySelectorAll(".time").forEach((b) => b.setAttribute("aria-checked", String(b.textContent === formatTime(hour))));
    renderSummary();
  }

  /* pregled */
  const sumTime = $("#sumTime");
  function renderSummary() {
    $("#sumDate").textContent = state.date ? cap(formatDateLong(state.date)) : "Izaberite dan";
    if (state.hour !== null) {
      sumTime.textContent = `${formatTime(state.hour)} – ${endOf(state.hour)}`;
      sumTime.classList.add("is-set");
    } else {
      sumTime.textContent = state.date ? "Izaberite vreme" : "i vreme";
      sumTime.classList.remove("is-set");
    }
  }
  const mirror = (inputId, outId) => {
    const input = $(inputId);
    const out = $(outId);
    const sync = () => { out.textContent = input.value.trim() || "—"; };
    input.addEventListener("input", sync);
    sync();
  };
  mirror("#address", "#sumAddress");

  /* vrsta vozila */
  const PLACEHOLDERS = { Automobil: "npr. Škoda Octavia", Kombi: "npr. VW Transporter", Kamion: "npr. MAN TGX", Autobus: "npr. Mercedes Tourismo" };
  const carInput = $("#car");
  const vehicleType = () => form.querySelector('input[name="vehicle"]:checked').value;
  function syncVehicle() {
    const type = vehicleType();
    carInput.placeholder = PLACEHOLDERS[type];
    const model = carInput.value.trim();
    $("#sumCar").textContent = model ? `${type}, ${model}` : type;
  }
  form.querySelectorAll('input[name="vehicle"]').forEach((r) => r.addEventListener("change", syncVehicle));
  carInput.addEventListener("input", syncVehicle);
  syncVehicle();

  /* ključ: kod druge osobe traži dodatni podatak */
  const keyHolderWrap = $("#keyHolderWrap");
  const keyHolder = $("#keyHolder");
  const keyWithOther = () => form.querySelector('input[name="keyHandover"]:checked').value === "Kod druge osobe";
  function syncKey() {
    const other = keyWithOther();
    keyHolderWrap.hidden = !other;
    keyHolder.required = other;
    if (!other) keyHolder.closest(".field").classList.remove("is-invalid");
    const holder = keyHolder.value.trim();
    $("#sumKey").textContent = other ? (holder || "Kod druge osobe") : "Predajem lično";
  }
  form.querySelectorAll('input[name="keyHandover"]').forEach((r) => r.addEventListener("change", () => {
    syncKey();
    if (keyWithOther()) keyHolder.focus();
  }));
  keyHolder.addEventListener("input", syncKey);
  syncKey();

  /* validacija — na napuštanju polja, ne tek na slanju */
  function validateField(input) {
    const value = input.value.trim();
    let ok = !input.required || value.length > 0;
    if (ok && input.type === "tel" && value) ok = /^[0-9+\s/\-()]+$/.test(value) && value.replace(/\D/g, "").length >= 6;
    if (ok && input.type === "email" && value) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    input.closest(".field").classList.toggle("is-invalid", !ok);
    input.setAttribute("aria-invalid", String(!ok));
    return ok;
  }

  form.querySelectorAll(".field input").forEach((input) => {
    input.addEventListener("blur", () => { if (input.value.trim()) validateField(input); });
    input.addEventListener("input", () => { if (input.closest(".field").classList.contains("is-invalid")) validateField(input); });
  });

  function validateAll() {
    let first = null;
    if (!state.date || state.hour === null) {
      $("#slotError").hidden = false;
      first = timesEl;
    }
    const ids = ["#car", "#address", ...(keyWithOther() ? ["#keyHolder"] : []), "#name", "#phone", "#email"];
    ids.forEach((id) => {
      const input = $(id);
      if (!validateField(input) && !first) first = input;
    });
    if (first) {
      first.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "center" });
      if (first.tagName === "INPUT") first.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  /* slanje */
  function buildBooking() {
    const data = Object.fromEntries(new FormData(form).entries());
    const get = (k) => (data[k] || "").trim();
    return {
      date: dateKey(state.date),
      dateLabel: `${formatDateLong(state.date)} ${state.date.getFullYear()}.`,
      time: formatTime(state.hour),
      timeEnd: endOf(state.hour),
      name: get("name"),
      phone: get("phone"),
      email: get("email"),
      address: get("address"),
      vehicleType: get("vehicle"),
      car: get("car"),
      plateAndColor: get("plate"),
      keyHandover: get("keyHandover"),
      keyHolder: keyWithOther() ? get("keyHolder") : "",
      note: get("note"),
      vacuumed: Boolean(data.vacuumed),
      cabinFilterReplaced: Boolean(data.filter),
    };
  }

  function bookingText(b) {
    return [
      "Novi zahtev za termin — Hedera Cleaning",
      "",
      `Datum: ${b.dateLabel}`,
      `Vreme: ${b.time} – ${b.timeEnd}`,
      "",
      `Ime i prezime: ${b.name}`,
      `Telefon: ${b.phone}`,
      `E-mail: ${b.email || "—"}`,
      `Adresa vozila: ${b.address}`,
      `Vozilo: ${b.vehicleType}, ${b.car}${b.plateAndColor ? ` (${b.plateAndColor})` : ""}`,
      `Ključ: ${b.keyHandover}${b.keyHolder ? ` — ${b.keyHolder}` : ""}`,
      `Napomena: ${b.note || "—"}`,
      "",
      `Enterijer usisan: ${b.vacuumed ? "da" : "ne"}`,
      `Filter kabine nedavno menjan: ${b.cabinFilterReplaced ? "da" : "ne"}`,
    ].join("\n");
  }

  async function sendBooking(b) {
    if (CONFIG.endpoint) {
      const res = await fetch(CONFIG.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ ...b, _subject: `Termin: ${b.dateLabel} u ${b.time} — ${b.name}`, message: bookingText(b) }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return;
    }
    const subject = encodeURIComponent(`Zakazivanje: ${b.dateLabel} u ${b.time}`);
    window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${encodeURIComponent(bookingText(b))}`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    $("#formError").hidden = true;
    if (!validateAll()) return;

    const booking = buildBooking();
    submitBtn.disabled = true;
    submitBtn.textContent = "Šaljem…";
    try {
      await sendBooking(booking);
      state.last = booking;
      showDone(booking);
    } catch (err) {
      console.error(err);
      const el = $("#formError");
      el.textContent = `Slanje nije uspelo. Pokušajte ponovo ili pišite na ${CONFIG.email}.`;
      el.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Zakaži termin";
    }
  });

  // potvrda se pojavljuje na istom mestu gde je bila forma
  function swap(from, to, after) {
    const ms = reducedMotion.matches ? 0 : 250;
    from.classList.add("is-leaving");
    setTimeout(() => {
      from.hidden = true;
      from.classList.remove("is-leaving");
      to.classList.add("is-leaving");
      to.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => to.classList.remove("is-leaving")));
      after && after();
    }, ms);
  }

  function showDone(b) {
    $("#doneText").textContent =
      `${b.name.split(" ")[0]}, primili smo zahtev za ${formatDateLong(state.date)} u ${b.time}h, na adresi ${b.address}. ` +
      `Javićemo vam se na ${b.phone} radi potvrde. ${b.keyHolder ? `Ključ preuzimamo: ${b.keyHolder}.` : "Pripremite ključ za predaju ekipi."}`;
    swap(bookingEl, doneEl, () => {
      doneEl.classList.add("is-shown");
      doneEl.focus({ preventScroll: true });
      $("#zakazivanje").scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    });
  }

  $("#newBooking").addEventListener("click", () => {
    form.reset();
    form.querySelectorAll(".field.is-invalid").forEach((f) => f.classList.remove("is-invalid"));
    state.hour = null;
    renderTimes();
    renderSummary();
    $("#sumAddress").textContent = "—";
    syncVehicle();
    syncKey();
    doneEl.classList.remove("is-shown");
    swap(doneEl, bookingEl);
  });

  /* .ics fajl za kalendar */
  $("#icsBtn").addEventListener("click", () => {
    const b = state.last;
    if (!b) return;
    const [y, mo, d] = b.date.split("-").map(Number);
    const start = new Date(y, mo - 1, d, Number(b.time.slice(0, 2)));
    const end = new Date(start.getTime() + CONFIG.treatmentMinutes * 60000);
    const stamp = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hedera Cleaning//Zakazivanje//SR",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@hederacleaning`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      "SUMMARY:Hedera Cleaning — dezinfekcija vozila",
      `LOCATION:${esc(b.address)}`,
      `DESCRIPTION:${esc(`Ključ: ${b.keyHolder || "predajem lično ekipi"}. Preporuka: usisan enterijer i nedavno zamenjen filter kabine.`)}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Pripremite ključ vozila za Hedera Cleaning",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `hedera-termin-${b.date}.ics` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* start */
  renderDays();
  if (days.length) selectDate(days[0]);
  renderSummary();
  requestAnimationFrame(updateArrows);
})();
