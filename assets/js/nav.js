/* ==========================================================================
   NAVIGACIJA — Osmo "Fixed Underlay Navigation"
   Zahteva: gsap + CustomEase (učitani preko CDN-a u <head>, defer).
   ========================================================================== */

function initFixedUnderlayNavigation() {
  if (!window.gsap || !window.CustomEase) {
    console.warn("[nav] GSAP ili CustomEase nije učitan — meni je neaktivan.");
    return;
  }

  CustomEase.create("energy", "M0,0 C0.32,0.72 0,1 1,1");

  const toggleBtn     = document.querySelector("[data-underlay-nav-toggle]");
  const toggleLabels  = document.querySelectorAll(".underlay-nav__toggle-label");
  const toggleBars    = document.querySelectorAll(".underlay-nav__toggle-bar");
  const menuEl        = document.querySelector("[data-underlay-nav-menu]");
  const largeItems    = document.querySelectorAll("[data-reveal-l]");
  const smallItems    = document.querySelectorAll("[data-reveal-s]");
  const menuBorder    = document.querySelector(".underlay-nav__bottom-border");
  const mainEl        = document.querySelector("[data-main]");
  const overlayEl     = document.querySelector("[data-underlay-nav-overlay]");
  const darkEl        = document.querySelector(".underlay-nav__dark");
  const corners       = document.querySelectorAll(".underlay-nav__corner");
  const overlayBorders = document.querySelectorAll(".underlay-nav__border-row");

  if (!toggleBtn || !menuEl || !mainEl || !overlayEl) return;

  /* Pomeraj šipki hamburgera do X-a: (razmak + debljina) / 2 — vidi nav.css */
  const BAR_SHIFT = "2.677px";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const speed = prefersReducedMotion ? 12 : 1;

  const closedColor = getComputedStyle(toggleBtn).color;
  const openColor   = getComputedStyle(menuEl).color;

  let isOpen = false;
  let tl;
  let enterEndTime = 0;

  const getMenuOffset = () => -menuEl.offsetWidth;

  /* Dok je meni zatvoren, njegovi linkovi ne smeju da hvataju tab fokus */
  menuEl.inert = true;

  gsap.set(overlayEl, { visibility: "hidden", pointerEvents: "none" });
  gsap.set(darkEl, { autoAlpha: 0 });
  gsap.set(mainEl, { x: 0 });
  gsap.set(toggleLabels, { yPercent: 0 });
  gsap.set(toggleBars, { y: 0, rotation: 0 });
  gsap.set(menuBorder, { scaleX: 0 });
  gsap.set([largeItems, smallItems], { autoAlpha: 0 });
  gsap.set(overlayBorders[0], { yPercent: -100 });
  gsap.set(overlayBorders[1], { yPercent: 100 });
  gsap.set(corners, { scale: 0 });

  function buildTimeline() {
    tl = gsap.timeline({
      paused: true,
      defaults: { ease: "energy", easeReverse: "power2.inOut" }
    });

    tl.set(overlayEl, { visibility: "visible", pointerEvents: "auto" }, 0);

    tl.to([mainEl, overlayEl], { x: getMenuOffset, duration: 0.7 }, 0)

      .to(darkEl,        { autoAlpha: 1, duration: 0.5 }, 0)
      .to(corners,       { scale: 1, duration: 0.5 }, 0)
      .to(overlayBorders,{ yPercent: 0, duration: 0.5 }, 0)
      .to(toggleLabels,  { yPercent: -100, duration: 0.4 }, 0)
      .to(toggleBtn,     { color: openColor, duration: 0.4 }, 0)

      .to(toggleBars[0], {
        y: BAR_SHIFT, rotation: 45, duration: 0.35,
        ease: "back.out(1.4)", easeReverse: "power3.out"
      }, 0.05)

      .to(toggleBars[1], {
        y: "-" + BAR_SHIFT, rotation: -45, duration: 0.35,
        ease: "back.out(1.4)", easeReverse: "power3.out"
      }, 0.05)

      .fromTo(largeItems,
        { autoAlpha: 0, xPercent: 25 },
        { autoAlpha: 1, xPercent: 0, duration: 0.7, stagger: 0.05, immediateRender: false },
        0
      )

      .fromTo(smallItems,
        { autoAlpha: 0, yPercent: 100 },
        { autoAlpha: 1, yPercent: 0, duration: 0.5, stagger: 0.03, ease: "power3.out", immediateRender: false },
        0.3
      )

      .to(menuBorder, { scaleX: 1, duration: 0.5 }, "<");

    enterEndTime = tl.duration();

    tl.addPause();

    tl.to([largeItems, smallItems], { autoAlpha: 0, duration: 0.3 }, "<")

      .to([mainEl, overlayEl], { x: 0, duration: 0.6 }, "<")
      .to(darkEl,  { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" }, "<")
      .to(corners, { scale: 0, duration: 0.5 }, "<")
      .to(overlayBorders[0], { yPercent: -100, duration: 0.5 }, "<")
      .to(overlayBorders[1], { yPercent: 100, duration: 0.5 }, "<")
      .to(toggleBtn, { color: closedColor, duration: 0.25 }, "<+=0.1")
      .to(toggleLabels, { yPercent: 0, duration: 0.25, ease: "power3.in" }, "<")
      .to(toggleBars, { y: 0, rotation: 0, duration: 0.25, ease: "power3.in" }, "<")

      .set(overlayEl, { visibility: "hidden", pointerEvents: "none" });
  }

  function toggle() {
    isOpen = !isOpen;

    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    toggleBtn.setAttribute("aria-label", isOpen ? "Zatvori meni" : "Otvori meni");
    document.body.setAttribute("data-menu-status", isOpen ? "open" : "");
    menuEl.inert = !isOpen;

    /* overflow:hidden ne zaustavlja ScrollSmoother — njega treba pauzirati posebno */
    const smoother = window.ScrollSmoother && ScrollSmoother.get();
    if (smoother) smoother.paused(isOpen);

    if (isOpen) {
      tl.invalidate();
      if (tl.time() >= enterEndTime) tl.timeScale(speed).restart();
      else tl.timeScale(speed).play();
    } else {
      if (tl.time() < enterEndTime) tl.timeScale(speed).reverse();
      else tl.timeScale(speed).play();
    }
  }

  buildTimeline();

  toggleBtn.addEventListener("click", toggle);

  overlayEl.addEventListener("click", () => {
    if (isOpen) toggle();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      toggle();
      toggleBtn.focus();
    }
  });

  /* Zatvori meni kad se klikne na link unutar njega */
  menuEl.addEventListener("click", (e) => {
    if (e.target.closest("a") && isOpen) toggle();
  });

  let resizeTimer;

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);

    resizeTimer = setTimeout(() => {
      if (isOpen) gsap.set([mainEl, overlayEl], { x: getMenuOffset() });
      else tl.invalidate();
    }, 150);
  });
}

document.addEventListener("DOMContentLoaded", initFixedUnderlayNavigation);

/* ==========================================================================
/* ==========================================================================
   Ponašanje headera pri skrolu

   1. Podloga — bez nje sadržaj prolazi ispod fiksiranog headera i tekst se
      preklapa sa logotipom i "Meni" dugmetom.
   2. Sakrivanje pri skrolu nadole, vraćanje pri skrolu nagore.
   3. Sakrivanje kad footer stigne pod header, da se footer vidi ceo.

   Sva tri koriste istu klasu .is-hidden; dok je meni otvoren CSS je poništava
   (vidi nav.css), inače ne bi imalo čime da se zatvori.
   ========================================================================== */

function initHeaderScrollState() {
  const header = document.querySelector(".underlay-nav__header");
  if (!header) return;

  const footer = document.querySelector(".site-footer");

  const OTPOR = 6;         /* px — ispod ovoga se smer ne menja, da ne treperi */
  const OD_VRHA = 120;     /* px — bliže vrhu header uvek ostaje */

  let lastY = window.scrollY;
  let sakrivenSkrolom = false;
  let ticking = false;

  const update = () => {
    const y = window.scrollY;

    header.classList.toggle("is-scrolled", y > 8);

    const razlika = y - lastY;

    /* lastY se pomera tek kad se pređe otpor, pa i sporo skrolovanje
       na kraju nakupi dovoljno da se smer prepozna */
    if (Math.abs(razlika) > OTPOR) {
      if (razlika > 0 && y > OD_VRHA) sakrivenSkrolom = true;
      else if (razlika < 0) sakrivenSkrolom = false;

      lastY = y;
    }

    if (y <= OD_VRHA) sakrivenSkrolom = false;

    /* Uslov za footer ne zavisi od stanja headera, pa nema povratne sprege */
    const footerStigao = footer
      ? footer.getBoundingClientRect().top <= header.offsetHeight
      : false;

    header.classList.toggle("is-hidden", sakrivenSkrolom || footerStigao);

    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });

  update();
}

document.addEventListener("DOMContentLoaded", initHeaderScrollState);
