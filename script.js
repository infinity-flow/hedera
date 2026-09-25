/* =========================================================
   Hedera Cleaning — interakcije i online zakazivanje
   ========================================================= */

/**
 * PODEŠAVANJA
 * - endpoint: URL na koji se šalje zahtev za termin (POST, JSON).
 *   Npr. Formspree ("https://formspree.io/f/xxxxxxx"), sopstveni backend, Make/Zapier webhook…
 *   Ako je prazan, otvara se e-mail klijent sa popunjenom porukom na adresu `email`.
 * - workingDays: dani u nedelji kada se radi (0 = nedelja, 1 = ponedeljak … 6 = subota).
 * - firstHour / lastHour: prvi i poslednji početak termina (termini na svakih sat vremena).
 * - minLeadHours: koliko sati unapred najranije može da se zakaže termin za danas.
 * - maxDaysAhead: koliko dana unapred je moguće zakazati.
 * - bookedSlots: zauzeti termini, format { "2026-10-01": [9, 13] } (ili ih učitajte sa servera).
 */
const CONFIG = {
  endpoint: "",
  email: "info@hederacleaning.rs",
  workingDays: [1, 2, 3, 4, 5, 6],
  firstHour: 9,
  lastHour: 16,
  treatmentMinutes: 45,
  minLeadHours: 2,
  maxDaysAhead: 60,
  bookedSlots: {},
};

const MONTHS = ["Januar", "Februar", "Mart", "April", "Maj", "Jun", "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"];
const MONTHS_GEN = ["januara", "februara", "marta", "aprila", "maja", "juna", "jula", "avgusta", "septembra", "oktobra", "novembra", "decembra"];
const WEEKDAYS = ["nedelja", "ponedeljak", "utorak", "sreda", "četvrtak", "petak", "subota"];

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const formatDateLong = (d) => `${WEEKDAYS[d.getDay()]}, ${d.getDate()}. ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}.`;
const formatTime = (h, m = 0) => `${pad(h)}:${pad(m)}`;
const endOf = (h) => {
  const total = h * 60 + CONFIG.treatmentMinutes;
  return formatTime(Math.floor(total / 60), total % 60);
};

/* ---------- Header & navigacija ---------- */
(function initHeader() {
  const header = $(".header");
  const toggle = $("#navToggle");
  const nav = $("#nav");

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Zatvori meni" : "Otvori meni");
  };
  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  $("#year").textContent = new Date().getFullYear();
})();

/* ---------- Animacija pri skrolovanju ---------- */
(function initReveal() {
  const targets = document.querySelectorAll(".section__head, .tech-step, .eliminates, .feature, .process__item, .prep-item, .panel, .summary__card, .faq details, .cta__inner");
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
  targets.forEach((el, i) => {
    el.classList.add("reveal");
    el.style.transitionDelay = `${(i % 4) * 60}ms`;
    io.observe(el);
  });
})();

/* ---------- Zakazivanje ---------- */
(function initBooking() {
  const grid = $("#calendarGrid");
  const monthLabel = $("#monthLabel");
  const prevBtn = $("#prevMonth");
  const nextBtn = $("#nextMonth");
  const slotsGrid = $("#slotsGrid");
  const slotsLabel = $("#slotsLabel");
  const form = $("#bookingForm");
  const bookingEl = $(".booking");
  const successEl = $("#success");
  const submitBtn = $("#submitBtn");

  const today = startOfDay(new Date());
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + CONFIG.maxDaysAhead);

  const state = {
    view: new Date(today.getFullYear(), today.getMonth(), 1),
    date: null,
    hour: null,
    lastBooking: null,
  };

  function availableHours(date) {
    const now = new Date();
    const booked = CONFIG.bookedSlots[dateKey(date)] || [];
    const hours = [];
    for (let h = CONFIG.firstHour; h <= CONFIG.lastHour; h++) {
      const slotStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h);
      const tooSoon = slotStart.getTime() - now.getTime() < CONFIG.minLeadHours * 3600 * 1000;
      hours.push({ hour: h, available: !tooSoon && !booked.includes(h) });
    }
    return hours;
  }

  function isDayBookable(date) {
    if (date < today || date > maxDate) return false;
    if (!CONFIG.workingDays.includes(date.getDay())) return false;
    return availableHours(date).some((s) => s.available);
  }

  function firstBookableDay() {
    const d = new Date(today);
    for (let i = 0; i <= CONFIG.maxDaysAhead; i++) {
      if (isDayBookable(d)) return new Date(d);
      d.setDate(d.getDate() + 1);
    }
    return null;
  }

  function renderCalendar() {
    const y = state.view.getFullYear();
    const m = state.view.getMonth();
    monthLabel.textContent = `${MONTHS[m]} ${y}`;

    prevBtn.disabled = y === today.getFullYear() && m === today.getMonth();
    nextBtn.disabled = new Date(y, m + 1, 1) > maxDate;

    const offset = (new Date(y, m, 1).getDay() + 6) % 7; // ponedeljak = prva kolona
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const frag = document.createDocumentFragment();

    for (let i = 0; i < offset; i++) {
      const empty = document.createElement("span");
      empty.className = "day day--empty";
      frag.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "day";
      btn.textContent = d;
      btn.dataset.date = dateKey(date);
      btn.setAttribute("aria-label", formatDateLong(date));

      const bookable = isDayBookable(date);
      btn.disabled = !bookable;
      if (date.getTime() === today.getTime()) btn.classList.add("is-today");
      if (state.date && date.getTime() === state.date.getTime()) {
        btn.classList.add("is-selected");
        btn.setAttribute("aria-pressed", "true");
      } else {
        btn.setAttribute("aria-pressed", "false");
      }
      btn.addEventListener("click", () => selectDate(date));
      frag.appendChild(btn);
    }

    grid.replaceChildren(frag);
  }

  function renderSlots() {
    slotsGrid.replaceChildren();
    if (!state.date) {
      slotsLabel.textContent = "Izaberite datum";
      return;
    }
    slotsLabel.textContent = `Slobodni termini — ${state.date.getDate()}. ${MONTHS_GEN[state.date.getMonth()]}`;

    const hours = availableHours(state.date);
    if (!hours.some((s) => s.available)) {
      const p = document.createElement("p");
      p.className = "slots__empty";
      p.textContent = "Nema slobodnih termina za ovaj dan.";
      slotsGrid.appendChild(p);
      return;
    }

    hours.forEach(({ hour, available }) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "slot";
      btn.setAttribute("role", "radio");
      btn.setAttribute("aria-checked", String(state.hour === hour));
      btn.innerHTML = `${formatTime(hour)}<small>do ${endOf(hour)}</small>`;
      btn.disabled = !available;
      if (!available) btn.setAttribute("aria-label", `${formatTime(hour)} — nije dostupno`);
      if (state.hour === hour) btn.classList.add("is-selected");
      btn.addEventListener("click", () => selectHour(hour));
      slotsGrid.appendChild(btn);
    });
  }

  function renderSummary() {
    $("#sumDate").textContent = state.date ? formatDateLong(state.date) : "—";
    $("#sumTime").textContent = state.hour !== null ? `${formatTime(state.hour)} – ${endOf(state.hour)}` : "—";
  }

  function selectDate(date) {
    state.date = date;
    if (state.hour !== null && !availableHours(date).find((s) => s.hour === state.hour)?.available) {
      state.hour = null;
    }
    renderCalendar();
    renderSlots();
    renderSummary();
  }

  function selectHour(hour) {
    state.hour = hour;
    $("#slotError").hidden = true;
    renderSlots();
    renderSummary();
  }

  prevBtn.addEventListener("click", () => {
    state.view = new Date(state.view.getFullYear(), state.view.getMonth() - 1, 1);
    renderCalendar();
  });
  nextBtn.addEventListener("click", () => {
    state.view = new Date(state.view.getFullYear(), state.view.getMonth() + 1, 1);
    renderCalendar();
  });

  /* ----- validacija ----- */
  const requiredFields = ["name", "phone", "car", "address"];

  function validateField(input) {
    const field = input.closest(".field");
    const value = input.value.trim();
    let ok = true;
    if (input.required && !value) ok = false;
    if (ok && input.type === "tel" && value) ok = /^[0-9+\s/\-()]{6,}$/.test(value) && value.replace(/\D/g, "").length >= 6;
    if (ok && input.type === "email" && value) ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    field.classList.toggle("is-invalid", !ok);
    input.setAttribute("aria-invalid", String(!ok));
    return ok;
  }

  form.querySelectorAll(".field input").forEach((input) => {
    input.addEventListener("blur", () => { if (input.value.trim() || input.required) validateField(input); });
    input.addEventListener("input", () => { if (input.closest(".field").classList.contains("is-invalid")) validateField(input); });
  });
  $("#unlocked").addEventListener("change", (e) => { if (e.target.checked) $("#unlockedError").hidden = true; });

  function validateAll() {
    let firstInvalid = null;

    if (!state.date || state.hour === null) {
      $("#slotError").hidden = false;
      firstInvalid = firstInvalid || $("#calendar");
    }

    [...requiredFields.map((id) => $(`#${id}`)), $("#email")].forEach((input) => {
      if (!validateField(input) && !firstInvalid) firstInvalid = input;
    });

    const unlocked = $("#unlocked");
    if (!unlocked.checked) {
      $("#unlockedError").hidden = false;
      firstInvalid = firstInvalid || unlocked.closest(".check");
    }

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      if (firstInvalid.focus && firstInvalid.tagName === "INPUT") firstInvalid.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  /* ----- slanje ----- */
  function buildBooking() {
    const data = Object.fromEntries(new FormData(form).entries());
    return {
      date: dateKey(state.date),
      dateLabel: formatDateLong(state.date),
      time: formatTime(state.hour),
      timeEnd: endOf(state.hour),
      name: data.name.trim(),
      phone: data.phone.trim(),
      email: (data.email || "").trim(),
      car: data.car.trim(),
      address: data.address.trim(),
      plate: (data.plate || "").trim(),
      color: (data.color || "").trim(),
      note: (data.note || "").trim(),
      unlocked: Boolean(data.unlocked),
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
      `Vozilo: ${b.car}${b.color ? `, ${b.color}` : ""}${b.plate ? ` (${b.plate})` : ""}`,
      `Adresa vozila: ${b.address}`,
      "",
      `Automobil otključan: ${b.unlocked ? "da" : "ne"}`,
      `Enterijer usisan: ${b.vacuumed ? "da" : "ne"}`,
      `Filter kabine nedavno menjan: ${b.cabinFilterReplaced ? "da" : "ne"}`,
      "",
      `Napomena: ${b.note || "—"}`,
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
    const body = encodeURIComponent(bookingText(b));
    window.location.href = `mailto:${CONFIG.email}?subject=${subject}&body=${body}`;
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
      state.lastBooking = booking;
      showSuccess(booking);
    } catch (err) {
      console.error(err);
      const formError = $("#formError");
      formError.textContent = `Slanje nije uspelo. Pokušajte ponovo ili nas pozovite / pišite na ${CONFIG.email}.`;
      formError.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Potvrdi zakazivanje";
    }
  });

  function showSuccess(b) {
    $("#successText").textContent =
      `Hvala, ${b.name.split(" ")[0]}! Primili smo zahtev za ${b.dateLabel} u ${b.time}h na adresi ${b.address}. ` +
      `Uskoro ćemo vas kontaktirati na ${b.phone} radi potvrde. Ne zaboravite da automobil bude otključan u vreme termina.`;
    bookingEl.hidden = true;
    successEl.hidden = false;
    successEl.focus({ preventScroll: true });
    $("#zakazivanje").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  $("#newBooking").addEventListener("click", () => {
    form.reset();
    form.querySelectorAll(".field.is-invalid").forEach((f) => f.classList.remove("is-invalid"));
    state.hour = null;
    successEl.hidden = true;
    bookingEl.hidden = false;
    renderSlots();
    renderSummary();
  });

  /* ----- .ics fajl za kalendar ----- */
  $("#icsBtn").addEventListener("click", () => {
    const b = state.lastBooking;
    if (!b) return;
    const [y, mo, d] = b.date.split("-").map(Number);
    const start = new Date(y, mo - 1, d, Number(b.time.slice(0, 2)), 0);
    const end = new Date(start.getTime() + CONFIG.treatmentMinutes * 60000);
    const stamp = (dt) => dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const esc = (s) => s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/[,;]/g, (c) => `\\${c}`);

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Hedera Cleaning//Zakazivanje//SR",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${Date.now()}@hederacleaning`,
      `DTSTAMP:${stamp(new Date())}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      "SUMMARY:Hedera Cleaning — dezinfekcija vozila",
      `LOCATION:${esc(b.address)}`,
      `DESCRIPTION:${esc("Ostavite automobil otključan. Preporuka: usisan enterijer i nedavno zamenjen filter kabine.")}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT1H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Otključajte automobil za Hedera Cleaning",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `hedera-termin-${b.date}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  /* ----- start ----- */
  const initial = firstBookableDay();
  if (initial) {
    state.date = initial;
    state.view = new Date(initial.getFullYear(), initial.getMonth(), 1);
  }
  renderCalendar();
  renderSlots();
  renderSummary();
})();
