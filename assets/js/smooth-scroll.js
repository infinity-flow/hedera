/* ==========================================================================
   SMOOTH SCROLLING — GSAP ScrollSmoother
   https://demos.gsap.com/demo/smooth-scrolling/

   Sadržaj koji se skroluje je u #smooth-wrapper > #smooth-content (vidi HTML).
   Fiksirani elementi — header, panel menija, overlay, modal i skip link —
   moraju da ostanu IZVAN omotača, inače ih transformacija sadržaja pomera.

   Druge skripte do instance dolaze preko ScrollSmoother.get(), bez globalne
   promenljive.
   ========================================================================== */

function initSmoothScroll() {
  if (!window.gsap || !window.ScrollTrigger || !window.ScrollSmoother) return;
  if (!document.getElementById("smooth-wrapper")) return;

  gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: reduce ? 0 : 0.8,     /* sekunde da sadržaj „stigne" scroll poziciju */
    smoothTouch: 0,               /* na dodir ostaje native scroll — brže i prirodnije */
    normalizeScroll: false,
    ignoreMobileResize: true      /* adresna traka na mobilnom ne izaziva refresh */
  });

  /* ---- Sidrni linkovi ----------------------------------------------------
     Native skok na #hash zaobilazi smoother, pa klik presrećemo i puštamo
     njegov scrollTo(), sa odmakom za fiksirani header.

     Napomena: smoother-ov lerp je asimptotski, pa skok preko cele stranice
     traje oko dve sekunde. To je priroda smooth skrola — ako smeta, jedini
     regulator je vrednost smooth iznad.
     ---------------------------------------------------------------------- */
  function headerOffset() {
    const header = document.querySelector(".underlay-nav__header");
    return (header ? header.offsetHeight : 72) + 24;
  }

  function goTo(target, animate) {
    smoother.scrollTo(target, animate, "top " + headerOffset() + "px");
  }

  document.addEventListener("click", (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link || link.target === "_blank") return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname !== location.pathname) return;
    if (!url.hash || url.hash === "#") return;

    const target = document.querySelector(url.hash);
    if (!target) return;

    e.preventDefault();
    goTo(target, !reduce);
    history.pushState(null, "", url.hash);
  });

  /* Dolazak na stranicu sa hešom u adresi */
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) requestAnimationFrame(() => goTo(target, false));
  }
}

document.addEventListener("DOMContentLoaded", initSmoothScroll);
