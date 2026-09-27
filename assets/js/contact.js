/* ==========================================================================
   KONTAKT FORMA — validacija na klijentu + slanje.

   ENDPOINT: forma trenutno nema server. Kad ga budeš imao, upiši ga u
   action="" na <form data-contact-form> u index.html — npr. Formspree,
   Web3Forms ili sopstveni PHP. Skripta šalje POST sa FormData i očekuje
   2xx odgovor. Dok je action prazan, slanje se ne pretvara da je uspelo.
   ========================================================================== */

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector("[data-contact-status]");
  const submit = form.querySelector("[data-contact-submit]");
  const trap   = form.querySelector('input[name="vebsajt"]');

  /* Native validacija je fallback dok JS ne preuzme; sad je gasimo
     da poruke budu naše i na srpskom. */
  form.setAttribute("novalidate", "");

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE = /^[+\d][\d\s/()-]{5,}$/;

  const rules = {
    ime:        (v) => (v.trim().length >= 2 ? "" : "Upišite ime i prezime."),
    email:      (v) => (EMAIL.test(v.trim()) ? "" : "Upišite ispravnu email adresu."),
    telefon:    (v) => (!v.trim() || PHONE.test(v.trim()) ? "" : "Upišite ispravan broj telefona."),
    usluga:     (v) => (v ? "" : "Izaberite uslugu."),
    poruka:     (v) => (v.trim().length >= 10 ? "" : "Napišite bar par rečenica o projektu."),
    saglasnost: (_, el) => (el.checked ? "" : "Potrebna je saglasnost za obradu podataka.")
  };

  function fieldOf(el) {
    return el.closest(".field");
  }

  function showError(el, message) {
    const field = fieldOf(el);
    if (!field) return;

    field.classList.toggle("is--invalid", Boolean(message));
    el.setAttribute("aria-invalid", message ? "true" : "false");

    const slot = field.querySelector("[data-error]");
    if (slot) slot.textContent = message;
  }

  function validateField(name) {
    const el = form.elements[name];
    if (!el || !rules[name]) return "";

    const message = rules[name](el.value, el);
    showError(el, message);
    return message;
  }

  function validateAll() {
    const failed = [];

    Object.keys(rules).forEach((name) => {
      if (validateField(name)) failed.push(name);
    });

    return failed;
  }

  /* Validacija na blur, a posle prve greške i dok korisnik kuca */
  Object.keys(rules).forEach((name) => {
    const el = form.elements[name];
    if (!el) return;

    el.addEventListener("blur", () => validateField(name));
    el.addEventListener("input", () => {
      if (fieldOf(el)?.classList.contains("is--invalid")) validateField(name);
    });
    el.addEventListener("change", () => {
      if (fieldOf(el)?.classList.contains("is--invalid")) validateField(name);
    });
  });

  function setStatus(message, kind) {
    status.textContent = message;
    status.classList.remove("is--ok", "is--error");
    if (kind) status.classList.add(kind === "ok" ? "is--ok" : "is--error");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("", null);

    /* Bot je popunio skriveno polje — tiho odustani */
    if (trap && trap.value) return;

    const failed = validateAll();

    if (failed.length) {
      setStatus("Proverite označena polja i pokušajte ponovo.", "error");
      form.elements[failed[0]].focus();
      return;
    }

    const endpoint = form.getAttribute("action");

    if (!endpoint) {
      setStatus(
        "Forma još nije povezana sa serverom, pa poruka nije poslata. " +
        "Pišite nam direktno na hello@infinityflow.rs.",
        "error"
      );
      return;
    }

    submit.disabled = true;
    const original = submit.textContent;
    submit.textContent = "Šaljem…";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });

      if (!res.ok) throw new Error("HTTP " + res.status);

      form.reset();
      Object.keys(rules).forEach((name) => {
        const el = form.elements[name];
        if (el) showError(el, "");
      });
      setStatus("Hvala. Javljamo se u roku od jednog radnog dana.", "ok");
    } catch (err) {
      setStatus(
        "Slanje nije uspelo. Pokušajte ponovo ili nam pišite na hello@infinityflow.rs.",
        "error"
      );
    } finally {
      submit.disabled = false;
      submit.textContent = original;
    }
  });
}

document.addEventListener("DOMContentLoaded", initContactForm);

/* ==========================================================================
   Spotlight na kontakt kartici — plavi sjaj prati kursor.

   Sjaj ne lepi za miš nego stiže za njim (lerp, 12% razlike po frejmu), pa
   kretanje deluje tečno umesto trzavo. Petlja radi samo dok je miš na kartici
   i gasi se čim sjaj stigne na cilj.
   ========================================================================== */

function initContactSpotlight() {
  const card = document.querySelector(".contact__card");
  if (!card || !window.matchMedia("(hover: hover)").matches) return;

  /* Uz reduce-motion sjaj ostaje na sredini umesto da juri kursor */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const EASE = 0.12;      /* koliko razlike sjaj pređe po frejmu */
  const SNAP = 0.5;       /* ispod ovoga smatramo da je stigao */

  let targetX = 0, targetY = 0;
  let currentX = 0, currentY = 0;
  let raf = null;
  let hovering = false;

  function write() {
    card.style.setProperty("--mx", currentX.toFixed(1) + "px");
    card.style.setProperty("--my", currentY.toFixed(1) + "px");
  }

  function setTarget(e) {
    const r = card.getBoundingClientRect();
    targetX = e.clientX - r.left;
    targetY = e.clientY - r.top;
  }

  function loop() {
    currentX += (targetX - currentX) * EASE;
    currentY += (targetY - currentY) * EASE;
    write();

    const arrived = Math.abs(targetX - currentX) < SNAP &&
                    Math.abs(targetY - currentY) < SNAP;

    raf = hovering && !arrived ? requestAnimationFrame(loop) : null;
  }

  card.addEventListener("pointerenter", (e) => {
    hovering = true;
    card.classList.add("is--hover");

    if (reduce) return;

    /* Postavi sjaj tačno tamo gde je miš ušao — bez vučenja sa stare pozicije */
    setTarget(e);
    currentX = targetX;
    currentY = targetY;
    write();
  });

  card.addEventListener("pointerleave", () => {
    hovering = false;
    card.classList.remove("is--hover");

    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  });

  if (reduce) return;

  card.addEventListener("pointermove", (e) => {
    setTarget(e);
    if (!raf) raf = requestAnimationFrame(loop);
  });
}

document.addEventListener("DOMContentLoaded", initContactSpotlight);
