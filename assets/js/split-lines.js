/* ==========================================================================
   SPLIT LINES — responsive line splits on scroll (GSAP demo)
   https://demos.gsap.com/demo/responsive-line-splits-on-scroll/

   SplitText deli tekst na linije, ScrollTrigger ih otkriva pri dolasku u
   kadar. autoSplit ponovo deli tekst kad se učita font ili promeni širina,
   pa prelomi linija ostaju tačni; animacija se pravi unutar onSplit() i
   vraća, da je SplitText sam očisti i sinhronizuje pri ponovnom deljenju.
   ========================================================================== */

function initSplitLines() {
  const targets = gsap.utils ? gsap.utils.toArray("[data-split]") : [];
  if (!targets.length) return;

  const reveal = () => targets.forEach((el) => el.classList.add("is-split"));

  /* Ako biblioteke nisu stigle, tekst mora da se vidi svakako */
  if (!window.gsap || !window.SplitText || !window.ScrollTrigger) {
    reveal();
    return;
  }

  gsap.registerPlugin(SplitText, ScrollTrigger);

  const mm = gsap.matchMedia();

  /* Uz reduce-motion tekst se samo pojavi, bez deljenja i kretanja */
  mm.add("(prefers-reduced-motion: reduce)", reveal);

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const splits = targets.map((el) =>
      SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "split-line",
        autoSplit: true,
        onSplit(self) {
          el.classList.add("is-split");

          return gsap.from(self.lines, {
            yPercent: 110,
            duration: 0.9,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              once: true
            }
          });
        }
      })
    );

    return () => splits.forEach((s) => s.revert());
  });

  /* Font je 125KB TTF sa font-display: swap — kad stigne, prelomi se menjaju */
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
  }
}

document.addEventListener("DOMContentLoaded", initSplitLines);
