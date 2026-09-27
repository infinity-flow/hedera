/* ==========================================================================
   FOOTER — scramble na sloganu "izaberi pravi tok"
   https://demos.gsap.com/demo/text-scrambling/

   Okida se jednom, kad footer uđe u kadar.

   chars je biran po širini glifova, ne nasumično. Slogan je veličinom podešen
   da tačno ispuni kontejner (13.742cqw), a span ima overflow:hidden zbog
   vertikalnog reza — pa bi svako šire mešanje bilo odsečeno s desne strane.

   Ciljna prosečna širina znaka je 30.6px. Slova "i f r t z" su sva ispod nje
   (16–35.5px), pa mešani tekst nikad ne prelije okvir: u 3000 simuliranih
   uzoraka maksimum je 99.1% kontejnera, prosek 84%. Za poređenje, mešanje
   slovima same rečenice ("izaberpvtok") prelivalo je u 98% slučajeva.
   ========================================================================== */

function initFooterScramble() {
  const word = document.querySelector("[data-scramble]");
  if (!word) return;

  if (!window.gsap || !window.ScrambleTextPlugin || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger);

  const finalText = word.textContent.trim();

  gsap.to(word, {
    duration: 1.6,
    ease: "none",
    scrambleText: {
      text: finalText,
      chars: "ifrtz",
      speed: 0.5,
      revealDelay: 0.35
    },
    scrollTrigger: {
      trigger: ".site-footer",
      start: "top 75%",
      once: true
    }
  });
}

document.addEventListener("DOMContentLoaded", initFooterScramble);
