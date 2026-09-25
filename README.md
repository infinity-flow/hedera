# Hedera Cleaning — web sajt

Jednostranični sajt za ultrasoničnu dezinfekciju vozila sa online zakazivanjem termina.
Čist HTML/CSS/JS, bez build koraka — dovoljno je otvoriti `index.html` ili ga postaviti na bilo koji statički hosting (Netlify, Vercel, GitHub Pages, cPanel…).

## Struktura

```
index.html        sadržaj stranice (sekcije: hero, tehnologija, prednosti, kako radimo, priprema, zakazivanje, pitanja, kontakt)
styles.css        dizajn (Inter, boje #FAF6E9 / #34C759 / #FFF / #000)
script.js         navigacija, animacije, kalendar i forma za zakazivanje
assets/logo.svg   logo / favicon
```

## Podešavanje zakazivanja

Na vrhu `script.js` nalazi se objekat `CONFIG`:

| Polje | Značenje |
|---|---|
| `endpoint` | URL na koji forma šalje zahtev (POST, JSON). Npr. [Formspree](https://formspree.io) — napravite formu i nalepite njen URL. Ako je prazno, otvara se e-mail klijent sa popunjenom porukom. |
| `email` | Adresa za e-mail rezervu i poruke o grešci. |
| `workingDays` | Radni dani (`0` = nedelja … `6` = subota). Podrazumevano pon–sub. |
| `firstHour` / `lastHour` | Prvi i poslednji početak termina. Podrazumevano 09:00–16:00 (poslednji tretman se završava u 16:45). |
| `minLeadHours` | Minimalno vreme unapred za današnje termine. |
| `maxDaysAhead` | Koliko dana unapred se može zakazati. |
| `bookedSlots` | Zauzeti termini, npr. `{ "2026-10-01": [9, 13] }`. |

> Sajt je statički, pa ne zna koje termine su drugi klijenti već zauzeli. Za automatsko blokiranje zauzetih termina potreban je mali backend (ili servis poput Cal.com / Google Calendar API) koji popunjava `bookedSlots`.

## Pre objavljivanja

- Zameniti kontakt telefon i e-mail u futeru (`index.html`) i u `CONFIG.email`.
- Podesiti `CONFIG.endpoint` da bi zahtevi stizali bez e-mail klijenta.
