/* ==========================================================================
   FAQ akordeon. CSS radi animaciju (grid-template-rows), JS samo prebacuje
   klasu i drži aria stanje. Bez JS-a svi odgovori ostaju otvoreni i čitljivi.
   ========================================================================== */

function initFaq() {
  const items = document.querySelectorAll(".faq__item");
  if (!items.length) return;

  items.forEach((item) => {
    const trigger = item.querySelector(".faq__trigger");
    const body    = item.querySelector(".faq__body");
    if (!trigger || !body) return;

    const open = item.classList.contains("is-open");
    trigger.setAttribute("aria-expanded", String(open));
    body.inert = !open;

    trigger.addEventListener("click", () => {
      const next = !item.classList.contains("is-open");

      item.classList.toggle("is-open", next);
      trigger.setAttribute("aria-expanded", String(next));
      body.inert = !next;
    });
  });
}

document.addEventListener("DOMContentLoaded", initFaq);
