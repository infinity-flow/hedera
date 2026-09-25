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
 * - panelHold: koliko dugo (u visinama ekrana) sekcija ostaje cela na ekranu pre nego što
 *   sledeća krene preko nje. 0 = odmah, 0.5 = pola ekrana skrolovanja, 1 = ceo ekran.
 * - showPhotoPlaceholders: dok neka fotografija iz assets/photos/ nedostaje, na njenom mestu
 *   stoji polje sa opisom kadra. Postavite na false pre objavljivanja ako neke fotografije
 *   još nemate — ta mesta će se tada potpuno sakriti.
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
  showPhotoPlaceholders: true,
  panelHold: 0.5,
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

/* ---------- Fotografije: polje sa opisom kadra dok fajl ne postoji ---------- */
(function initPhotos() {
  if (!CONFIG.showPhotoPlaceholders) document.documentElement.classList.add("no-photo-placeholders");
  const CAMERA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

  document.querySelectorAll(".photo").forEach((fig) => {
    const img = fig.querySelector("img");
    const ph = document.createElement("div");
    ph.className = "photo__ph";
    ph.setAttribute("aria-hidden", "true");
    ph.innerHTML = `${CAMERA}<strong></strong><code></code><small></small>`;
    ph.querySelector("strong").textContent = fig.dataset.shot || "";
    ph.querySelector("code").textContent = img.getAttribute("src");
    ph.querySelector("small").textContent = `Format ${fig.dataset.ratio}`;
    fig.appendChild(ph);

    const missing = () => fig.classList.add("is-missing");
    if (img.complete && img.naturalWidth === 0) missing();
    else img.addEventListener("error", missing, { once: true });
  });
})();

/* ---------- Navigacija ---------- */
(function initNav() {
  const nav = $(".nav");
  const toggle = $("#navToggle");
  const sheet = $("#navSheet");
  const scrim = $("#scrim");

  // rezerva bez GSAP-a: beli tekst dok je navigacija preko hero videa
  if (!window.ScrollTrigger) {
    const hero = $("#hero");
    const onScroll = () => nav.classList.toggle("is-over-hero", hero.getBoundingClientRect().bottom > nav.offsetHeight);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
  }

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

/* ---------- Skrolovanje: jedno mesto za sve skokove na stranici ----------
   Sa ScrollSmoother-om se skače kroz njega, bez njega nativno. */
const Scroll = {
  smoother: null,
  to(target, position = "top top") {
    if (this.smoother) {
      this.smoother.scrollTo(target, true, position);
    } else if (target === 0) {
      window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
    } else {
      target.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: position.startsWith("center") ? "center" : "start" });
    }
  },
  refresh() { if (window.ScrollTrigger) ScrollTrigger.refresh(); },
};

/* ---------- GSAP: glatko skrolovanje, paneli, navigacija, hero video ---------- */
(function initMotion() {
  const nav = $(".nav");
  const hero = $("#hero");
  const video = $("#heroVideo");
  const firstSection = hero.nextElementSibling;
  const root = document.documentElement;

  // video se pušta sam; kod "smanjenog kretanja" ostaje prvi kadar
  if (reducedMotion.matches) { video.removeAttribute("autoplay"); video.pause(); }
  const playVideo = () => { if (!reducedMotion.matches && !document.hidden) video.play().catch(() => {}); };
  document.addEventListener("visibilitychange", () => (document.hidden ? video.pause() : playVideo()));

  // linkovi ka sekcijama (#...) idu kroz Scroll.to
  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute("href");
    const target = id === "#top" ? 0 : id.length > 1 && document.querySelector(id);
    if (target === null || target === false) return;
    e.preventDefault();
    Scroll.to(target);
  });

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger, window.ScrollSmoother);

  /* Navigacija svesna smera (directionally-aware header):
     skriva se pri skrolovanju nadole, vraća se čim krenete nagore. */
  const showNav = gsap.from(nav, { yPercent: -150, paused: true, duration: 0.35, ease: "power2.out" }).progress(1);
  ScrollTrigger.create({
    start: "top top",
    end: "max",
    onUpdate(self) {
      if (nav.classList.contains("is-open") || self.scroll() < 120 || self.direction === -1) showNav.play();
      else showNav.reverse();
    },
  });

  // beli tekst dok je navigacija preko hero videa; video staje kad ga prva sekcija potpuno prekrije
  nav.classList.add("is-over-hero");
  ScrollTrigger.create({
    trigger: firstSection,
    start: () => `top ${nav.offsetHeight}px`,
    onEnter: () => nav.classList.remove("is-over-hero"),
    onLeaveBack: () => nav.classList.add("is-over-hero"),
  });
  ScrollTrigger.create({
    trigger: firstSection,
    start: "top top",
    onEnter: () => video.pause(),
    onLeaveBack: playVideo,
  });

  const mm = gsap.matchMedia();

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    root.classList.add("has-smoother", "has-panels");

    /* Glatko skrolovanje (ScrollSmoother). Na ekranima osetljivim na dodir ostaje skoro nativno. */
    if (window.ScrollSmoother) {
      Scroll.smoother = ScrollSmoother.create({
        wrapper: "#smooth-wrapper",
        content: "#smooth-content",
        smooth: 1.5,          // koliko sekundi skrol "dostiže" točkić — veće = sporije i mekše
        smoothTouch: 0.1,
        effects: false,
      });
    }

    /* Paneli sa "overscroll"-om:
       - panel je najmanje visine ekrana; viši panel se kači tek kad mu dno dođe do dna ekrana,
         pa se prvo pročita ceo;
       - posle toga sledi PAUZA (CONFIG.panelHold × visina ekrana) u kojoj panel stoji ceo na ekranu;
       - tek onda sledeći panel klizi preko njega, a prekriveni se blago zatamni. */
    const panels = gsap.utils.toArray(".panel");
    const cover = $(".closing");
    const holdPx = () => window.innerHeight * CONFIG.panelHold;
    const spacers = [];
    panels.forEach((panel, i) => {
      panel.style.zIndex = String(i + 1);

      // prazan prostor posle panela = pauza pre nego što sledeći krene preko njega
      const spacer = document.createElement("div");
      spacer.className = "panel-hold";
      spacer.setAttribute("aria-hidden", "true");
      panel.after(spacer);
      spacers.push(spacer);

      ScrollTrigger.create({
        trigger: panel,
        start: () => (panel.offsetHeight <= window.innerHeight + 1 ? "top top" : "bottom bottom"),
        end: () => `+=${window.innerHeight + holdPx()}`,
        pin: true,
        pinSpacing: false,
      });
      const next = panels[i + 1] || cover;
      gsap.fromTo(panel, { "--dim": 0 }, {
        "--dim": 0.4,
        ease: "none",
        scrollTrigger: { trigger: next, start: "top bottom", end: "top top", scrub: true },
      });
    });
    cover.style.zIndex = $(".footer").style.zIndex = String(panels.length + 1);
    const sizeSpacers = () => spacers.forEach((el) => { el.style.height = `${holdPx()}px`; });
    sizeSpacers();
    ScrollTrigger.addEventListener("refreshInit", sizeSpacers);

    /* position: sticky ne radi unutar ScrollSmoother-a, pa pregled termina kačimo GSAP-om */
    const summaryPin = gsap.matchMedia();
    summaryPin.add("(min-width: 1001px)", () => {
      const summary = $(".summary");
      ScrollTrigger.create({
        trigger: "#booking",
        pin: summary,
        pinSpacing: false,
        start: "top 120px",
        end: () => `bottom ${120 + summary.offsetHeight}px`,
        refreshPriority: -1,
      });
    });

    // visina se menja (FAQ, greške u formi, potvrda...) — preračunaj pozicije
    let t;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 150); });
    ro.observe($("#smooth-content"));

    return () => {
      ro.disconnect();
      ScrollTrigger.removeEventListener("refreshInit", sizeSpacers);
      spacers.forEach((el) => el.remove());
      summaryPin.revert();
      root.classList.remove("has-smoother", "has-panels");
      Scroll.smoother = null;
      panels.forEach((p) => { p.style.zIndex = ""; });
    };
  });

  if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
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
      Scroll.to(first, "center center");
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
      Scroll.refresh();
      Scroll.to($("#zakazivanje"));
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
