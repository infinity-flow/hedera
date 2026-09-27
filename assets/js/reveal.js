/* ==========================================================================
   REVEAL — otkrivanje elemenata [data-animate].
   Bez dodatnih biblioteka; animacija je u CSS-u (base.css).

   Podrazumevano se okida kad element uđe u kadar. Elementi sa
   data-animate-on="load" se otkrivaju odmah po učitavanju — za sadržaj koji
   je već u prvom ekranu i treba da uđe zajedno sa herom, a ne tek na skrol.
   ========================================================================== */

function initReveal() {
  const items = Array.from(document.querySelectorAll("[data-animate]"));
  if (!items.length) return;

  const odmah = items.filter((el) => el.dataset.animateOn === "load");
  const naSkrol = items.filter((el) => el.dataset.animateOn !== "load");

  const prikazi = (el) => el.classList.add("is-visible");

  /* Bez IntersectionObserver-a ili uz reduce-motion: prikaži sve odmah */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduce || !("IntersectionObserver" in window)) {
    items.forEach(prikazi);
    return;
  }

  /* Sledeći frejm, da se skriveno stanje jednom iscrta pa da prelaz ima šta da animira */
  if (odmah.length) requestAnimationFrame(() => odmah.forEach(prikazi));

  if (!naSkrol.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        prikazi(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
  );

  naSkrol.forEach((el) => observer.observe(el));
}

document.addEventListener("DOMContentLoaded", initReveal);
