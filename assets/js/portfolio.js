/* ==========================================================================
   PORTFOLIO — beskonačni slajder + modal sa detaljima rada
   https://demos.gsap.com/demo/infinite-card-slider/

   Kartice se ne dupliraju. Svakoj se x računa kao wrap(pozicija + i * širina)
   preko gsap.utils.wrap(), pa kad ispadne levo, ponovo ulazi zdesna. Zbog toga
   je broj radova nebitan — devet ili devedeset, logika je ista.

   Pomeraju je tri izvora: lagano automatsko klizanje, prevlačenje mišem ili
   prstom (Draggable) i inercija posle puštanja (InertiaPlugin).
   ========================================================================== */

function initPortfolioSlider() {
  const slider = document.querySelector("[data-slider]");
  const track = document.querySelector("[data-slider-track]");
  if (!slider || !track || !window.gsap || !window.Draggable) return;

  gsap.registerPlugin(Draggable);
  if (window.InertiaPlugin) gsap.registerPlugin(InertiaPlugin);

  const cards = gsap.utils.toArray(".work", track);
  if (!cards.length) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SPEED = 0.35;              /* px po frejmu na 60fps */

  let cardW = 0;
  let wrapX = null;
  let position = 0;
  let hovering = false;
  let dragging = false;

  function render() {
    if (!wrapX) return;

    for (let i = 0; i < cards.length; i++) {
      gsap.set(cards[i], { x: wrapX(position + i * cardW) });
    }
  }

  function measure() {
    const gap = parseFloat(getComputedStyle(slider).getPropertyValue("--card-gap")) || 20;
    const w = cards[0].getBoundingClientRect().width;
    if (!w) return;                /* layout još nije spreman */

    cardW = w + gap;

    /* Raspon je dug tačno koliko ceo niz, pa je prelaz neprimetan */
    wrapX = gsap.utils.wrap(-cardW, cards.length * cardW - cardW);
    render();
  }

  /* Širina kartice je clamp(..., 23vw, ...), pa se menja sa viewportom. Merenje
     odmah po učitavanju uhvati pogrešnu vrednost dok se layout još sleže —
     ResizeObserver hvata i to i svaku kasniju promenu. */
  if (window.ResizeObserver) {
    new ResizeObserver(measure).observe(slider);
  } else {
    measure();
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(measure, 150);
    });
  }

  /* ResizeObserver ne pomaže ako je element u trenutku posmatranja široko 0
     (npr. sakriven tab) — zato i direktan poziv, plus još jedan posle load-a
     kad su slike i font sigurno tu. */
  measure();
  window.addEventListener("load", measure);

  /* ---- Automatsko klizanje ------------------------------------------------ */
  if (!reduce) {
    gsap.ticker.add((time, deltaTime) => {
      if (hovering || dragging || !wrapX) return;

      position -= SPEED * (deltaTime / 16.667);
      render();
    });

    slider.addEventListener("pointerenter", () => { hovering = true; });
    slider.addEventListener("pointerleave", () => { hovering = false; });
  }

  /* ---- Prevlačenje -------------------------------------------------------- */
  const proxy = document.createElement("div");
  let startPos = 0;

  Draggable.create(proxy, {
    type: "x",
    trigger: slider,
    dragClickables: false,        /* dugme oka ostaje klikabilno */
    allowNativeTouchScrolling: true,
    inertia: Boolean(window.InertiaPlugin),

    onPressInit() {
      gsap.set(proxy, { x: 0 });
    },
    onPress() {
      dragging = true;
      startPos = position;
      slider.classList.add("is--dragging");
    },
    onDrag() {
      position = startPos + this.x;
      render();
    },
    onThrowUpdate() {
      position = startPos + this.x;
      render();
    },
    onRelease() {
      slider.classList.remove("is--dragging");
      if (!this.isThrowing) dragging = false;
    },
    onThrowComplete() {
      dragging = false;
    }
  });
}

/* ==========================================================================
   MODAL sa detaljima rada — sadržaj se klonira iz <template> u kartici
   ========================================================================== */

function initWorkModal() {
  const track = document.querySelector("[data-slider-track]");
  const dialog = document.querySelector("[data-work-dialog]");
  if (!track || !dialog || typeof dialog.showModal !== "function") return;

  const dialogBody = dialog.querySelector("[data-work-dialog-body]");
  let lastTrigger = null;

  track.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-work-open]");
    if (!btn) return;

    const work = btn.closest(".work");
    const tpl = work.querySelector("[data-work-details]");
    if (!tpl) return;

    lastTrigger = btn;
    dialogBody.replaceChildren(tpl.content.cloneNode(true));
    dialog.setAttribute("aria-label", work.querySelector(".work__title").textContent.trim());
    dialog.showModal();
    document.body.style.overflow = "hidden";

    /* overflow:hidden ne zaustavlja ScrollSmoother — pauziramo ga posebno */
    const smoother = window.ScrollSmoother && ScrollSmoother.get();
    if (smoother) smoother.paused(true);
  });

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.closest("[data-work-close]")) dialog.close();
  });

  dialog.addEventListener("close", () => {
    document.body.style.overflow = "";

    const smoother = window.ScrollSmoother && ScrollSmoother.get();
    if (smoother) smoother.paused(false);

    dialogBody.replaceChildren();
    if (lastTrigger) lastTrigger.focus();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initPortfolioSlider();
  initWorkModal();
});
