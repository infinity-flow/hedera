# Hedera Cleaning — web sajt

Jednostranični sajt za ultrasoničnu dezinfekciju vozila sa online zakazivanjem termina.
Čist HTML/CSS/JS, bez build koraka — dovoljno je otvoriti `index.html` ili ga postaviti na bilo koji statički hosting (Netlify, Vercel, GitHub Pages, cPanel…).

## Struktura

```
index.html               sadržaj stranice (hero, tehnologija, postupak, priprema, zakazivanje, pitanja, kontakt)
styles.css               dizajn (Inter, boje #FAF6E9 / #34C759 / #FFF / #000)
script.js                navigacija, GSAP animacije, izbor dana/vremena i forma za zakazivanje
assets/vendor/gsap/      GSAP 3.15 (gsap, ScrollTrigger, ScrollSmoother) — lokalno, bez CDN-a
assets/hedera-logo.svg   logo (tamni) i hedera-logo-white.svg (za navigaciju preko videa)
assets/favicon.svg       ikonica (slovo H iz logotipa)
assets/video/            hero video: hero-1080.mp4 (desktop), hero-720.mp4 (telefon), hero-poster.jpg
assets/hero-interior.*   fotografija ventilacije u sekciji Tehnologija (JPG + WebP 1200/2000 px)
assets/photos/           ostale fotografije — spisak kadrova i naziva fajlova je u assets/photos/README.md
```

## Animacije (GSAP)

- **Glatko skrolovanje** — ScrollSmoother (`#smooth-wrapper` / `#smooth-content` u `index.html`). Navigacija i meni su namerno van omotača.
- **Navigacija svesna smera** — skriva se pri skrolovanju nadole, vraća se pri skrolovanju nagore.
- **Paneli koji se preklapaju** — svaka sekcija sa klasom `panel` se zakači, a sledeća klizi preko nje; sekcija viša od ekrana se prvo pročita do kraja. Pre nego što sledeća krene, sekcija stoji cela na ekranu koliko kaže `CONFIG.panelHold` (u visinama ekrana).
- Brzina "dostizanja" glatkog skrola je `smooth` u `ScrollSmoother.create` (`script.js`).
- Korisnicima koji u sistemu imaju uključeno „smanjeno kretanje“ sve ovo je isključeno i sajt se skroluje normalno.
- GSAP je besplatan i za komercijalnu upotrebu ([GSAP Standard License](https://gsap.com/standard-license)).

## Podešavanje zakazivanja

Na vrhu `script.js` nalazi se objekat `CONFIG`:

| Polje | Značenje |
|---|---|
| `endpoint` | URL na koji forma šalje zahtev (POST, JSON). Npr. [Formspree](https://formspree.io) — napravite formu i nalepite njen URL. Ako je prazno, otvara se e-mail klijent sa popunjenom porukom. |
| `email` | Adresa za e-mail rezervu i poruke o grešci. |
| `workingDays` | Radni dani (`0` = nedelja … `6` = subota). Podrazumevano pon–sub. |
| `firstHour` / `lastHour` | Prvi i poslednji početak termina. Podrazumevano 09:00–16:00 (poslednji tretman se završava u 16:45). |
| `minLeadHours` | Minimalno vreme unapred za današnje termine. |
| `daysAhead` | Koliko dana unapred se može zakazati. |
| `bookedSlots` | Zauzeti termini, npr. `{ "2026-10-01": [9, 13] }`. |
| `panelHold` | Pauza pre nego što sledeća sekcija krene preko trenutne, u visinama ekrana (podrazumevano `0.5`). |
| `showPhotoPlaceholders` | `true` = na mestu fotografije koja nedostaje stoji polje sa opisom kadra; `false` = to mesto se sakriva. |

> Sajt je statički, pa ne zna koje termine su drugi klijenti već zauzeli. Za automatsko blokiranje zauzetih termina potreban je mali backend (ili servis poput Cal.com / Google Calendar API) koji popunjava `bookedSlots`.

## Pre objavljivanja

- Zameniti kontakt telefon i e-mail u futeru (`index.html`) i u `CONFIG.email`.
- Podesiti `CONFIG.endpoint` da bi zahtevi stizali bez e-mail klijenta.
- Ubaciti fotografije u `assets/photos/` ili postaviti `showPhotoPlaceholders: false`.
