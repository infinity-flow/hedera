# InfinityFlow — stanje projekta

Statički sajt (HTML + CSS + JS, bez build koraka). Gradi se **sekcija po sekcija**.

## Dizajn
Figma: https://www.figma.com/design/BbnPH6qWKSBThT7u8j0bh9/Untitled
- `node 1:6` — "Desktop - 8" (header + hero + 3 kartice), frame 1440×1419
- `node 3:21 / 3:22 / 3:24` — tri foto-kartice ispod hera
- `node 5:25` — "Desktop - 9" (footer)

Node ID svake sekcije stoji u komentaru na vrhu odgovarajućeg CSS fajla.

## Urađeno
- [x] **Meni** — Osmo "Fixed Underlay Navigation" (`assets/css/nav.css`, `assets/js/nav.js`)
      Stavke: Početna, Usluge, Portfolio, O nama, Zakaži poziv, FAQ
- [x] **Hero** — `assets/css/hero.css`
- [x] **Tri kartice ispod hera** — `assets/css/pillars.css` (Figma 3:21 / 3:22 / 3:24)
- [x] **Usluge** — `assets/css/services.css` (numerisana lista 01–04, moj predlog, nije iz Figme)
- [x] **Portfolio** — `assets/css/portfolio.css` + `assets/js/portfolio.js` (grid 3×3, 9 radova,
      otvaranje na "Pogledaj više", modal sa detaljima; moj predlog, nije iz Figme)
- [x] **Kontakt / Zakaži konsultacije** — `assets/css/contact.css` + `assets/js/contact.js`
      (uklj. spotlight `#106ACA` koji prati miš)
- [x] **FAQ** — `assets/css/faq.css` + `assets/js/faq.js` (akordeon, 8 pitanja, moj tekst)
- [x] **Footer** — `assets/css/footer.css` (Figma 5:25), 100vh + vertikalni flex
- [x] **Reveal na skrol** — `assets/js/reveal.js` + `[data-animate]` u `base.css`, generički za sve sekcije
- [x] **Podloga headera pri skrolu** — `.is-scrolled` u `nav.css` + `nav.js`
- [x] **Reveal teksta po linijama** — `assets/js/split-lines.js` (SplitText + ScrollTrigger)
- [x] **Smooth scrolling** — `assets/js/smooth-scroll.js` (ScrollSmoother), na sve tri stranice
- [x] **Scramble na sloganu u footeru** — `assets/js/footer-scramble.js` (ScrambleTextPlugin)

## Sledeće
- [ ] O nama

- [ ] Politika privatnosti / Uslovi korišćenja (linkovi u meniju i formi vode na #)

## Otvoreno / za kasnije
- Font `StackSansHeadline-VariableFont_wght.ttf` je 125KB TTF — konvertovati u woff2 (~55KB).
  Traži Node ili Python, kojih trenutno nema na mašini.
- Panel menija nije dizajniran u Figmi — boje su izvedene iz hero dizajna
  (`#F5F5F7` podloga, `#0D1B2A` tekst), tipografija po Osmo proporcijama.
- Odstupanja od Figme u hero sekciji (namerna, dogovoriti ako smeta):
  kartica poravnata na kontejner 1320px umesto 1325.48px; sadržaj centriran
  u kartici umesto u frame-u (~6px razlike); ispravljen typo "konsulatcije".

## Lokalni preview
Nema Node/Python — koristi se mini PowerShell static server:

    powershell -NoProfile -ExecutionPolicy Bypass -File serve.ps1

Server sluša na http://localhost:5173

## Napomene uz pillars sekciju
- `.pillars` ima negativan `margin-top` koji poništava donji padding hero sekcije,
  da bi razmak bio 20px kao u Figmi, a da `hero.css` ostane netaknut.
  **Ako se ikad promeni `padding-bottom` u `hero.css`, promeniti i taj calc.**
  Čistija varijanta: staviti `padding-bottom: 20px` u `.hero` i obrisati negativni margin.
- Slike su Figma exportovi, resajzovane na max 1200px i prekodirane u JPEG q82
  preko `System.Drawing` (12.05 MB PNG → 605 KB JPG). Originali nisu zadržani —
  ponovo se skidaju iz Figme.
- Ispravljeni typo-i iz dizajna: "uskladjivanja" → "usklađivanja",
  "izvodjačima" → "izvođačima".

## Napomene uz portfolio
- **Sadržaj projekata ide u `<template data-work-details>`** unutar svakog `<li class="work">`
  u `index.html`. Modal samo klonira taj template — kad stigne pravi sadržaj, menja se
  isključivo template, ništa u CSS-u ni JS-u. Trenutno stoji neutralan filler tekst.
- Slike `work-1..9.jpg` su generisani placeholderi (gradijent + broj), ne prave fotografije.
- Skupljena visina se računa u JS-u iz stvarne visine kartice:
  `cardH * 1.5 + rowGap`, gradijent `cardH * 0.5`. Radi na svakom breakpointu.
  Na mobilnom (1 kolona) to znači teaser od 1.5 kartice — ako želiš više,
  promeni faktor `1.5` u `portfolio.js`.
- Ikonica oka koristi `border: 0.5px`, ne `outline` — `reset.css` koristi `outline`
  za `:focus-visible`, pa bi se fokus prsten i ukras međusobno gasili.
- Radovi koji su odsečeni dobijaju `inert` da ne hvataju tab fokus (7 / 5 / 3
  skrivenih, zavisno od broja kolona).

## Ispravljeni bagovi
- `.hero__card` je imao `aspect-ratio` + `min-height` bez `width`. Kad min-height pobedi,
  aspect-ratio računa širinu unazad — kartica je bila 927.7px u kontejneru od 810px,
  tj. horizontalni scroll na svim širinama između ~768 i ~1100px. Rešeno sa `width: 100%`.
- Zajedničko zaglavlje sekcije izdvojeno u `base.css` kao
  `.section-head` / `.section-title` / `.section-lead` / `.eyebrow`
  (koriste ga Usluge i Portfolio; pre toga je bilo zaključano u `services.css`).

## !! Kontakt forma — nedostaje endpoint
Forma validira sve na klijentu, ali **nema server**. Da proradi, upiši URL u
`action=""` na `<form data-contact-form>` u `index.html`. Skripta šalje `POST`
sa `FormData` i očekuje 2xx. Radi sa Formspree, Web3Forms ili sopstvenim PHP-om.

Dok je `action` prazan, forma **ne glumi uspeh** — javlja da nije povezana i
upućuje na email. Namerno, da ne bi ćutke gubila prave upite.

Ostalo za zameniti: `kontakt@infinityflow.rs`, `+381 60 000 0000` i link ka
Politici privatnosti (sad je `#`).

## Ispravljeni bagovi (drugi krug)
- **Scrollbar preko stranice dok je meni zatvoren.** GSAP `fromTo` podrazumevano
  renderuje "from" stanje odmah, pa su stavke menija stajale na `xPercent: 25`
  i pravile horizontalni overflow u `.underlay-nav__inner` (`overflow: auto`).
  Rešeno sa `immediateRender: false` + `overflow-x: hidden` na inner-u.
- **Tri kartice ispod hera nisu bile centrirane** (vidi se tek preko ~1500px).
  `reset.css` je imao `ul[role="list"] { margin: 0 }` sa specifičnošću (0,1,1),
  što je gasilo `margin-inline: auto` na `.pillars__grid` (0,1,0). Reset je sada
  umotan u `:where()` (nulta specifičnost). Isti bag je tiho jeo i `margin-bottom`
  na `.work-modal__meta`.
- Portfolio na jednoj koloni sada pokazuje 2.5 kartice umesto 1.5.

## Napomene uz footer
- Visina `min-height: 100vh` (ne `height`), pa sadržaj nikad ne ispada iz okvira.
  `.site-footer__inner` je flex kolona sa `flex: 1`, a `.site-footer__word` ima
  `margin-top: auto` — to gura veliku reč i donju traku ka dnu.
- Kolone: `grid-template-columns: 402fr 260fr 308fr 350fr` sa `gap: 0`, da počeci
  kolona padnu tačno na Figma pozicije 0 / 402 / 662 / 970 unutar kontejnera 1320.
- Velika reč je **pravi tekst**, ne maska iz Figme. Veličina ide u `cqw`
  (container query jedinice) jer `vw` ne prati kontejner — sa `vw` je reč
  prelazila okvir na svim širinama ispod 1920.
  Odnos: tekst je širok `7.2256 × font-size`, u Figmi zauzima `0.993` kontejnera
  → `font-size: 13.742cqw`. Klip `0.7281em` = `132.078 / 181.39` iz Figme.
- **Gornji padding je 96–120px umesto Figma 78.64px.** Footer je tačno 100vh, pa
  kad se dođe do dna stranice njegov prvi red padne ispod fiksiranog headera.
  Dizajn to nije mogao da predvidi jer u njemu nema fiksiranog headera.
- Kontakt podaci iz footera (`hello@infinityflow.rs`, `+381 60 130 44 55`) su
  prepisani i u kontakt formu — ranije su tamo stajali izmišljeni placeholderi.

## Header: kada nestaje
`initHeaderScrollState` u `nav.js` vodi tri stvari, sve preko iste klase `.is-hidden`:

1. **Skrol nadole → nestaje, skrol nagore → vraća se.** Prag je 6px razlike (ispod
   toga se smer ne menja, da ne treperi) i 120px od vrha (bliže vrhu header uvek
   ostaje). `lastY` se pomera tek kad se pređe prag, pa i sporo skrolovanje na
   kraju nakupi dovoljno da se smer prepozna.
2. **Footer stigao pod header** — da se footer vidi ceo.
3. Podloga (`.is-scrolled`) je odvojena i pali se već posle 8px.

Koristi se `visibility: hidden`, pa header nestaje i iz tab redosleda, ne samo iz
slike.

Izuzetak: dok je meni otvoren header ostaje vidljiv, inače ne bi imao čime da se
zatvori. To rešava CSS pravilo `body[data-menu-status="open"] .underlay-nav__header.is-hidden`,
bez ikakve veze sa JS-om.

Ovo je usput sklonilo i svetlu traku headera preko tamnog footera. Ostaje isti
efekat preko tamne kontakt kartice (header prelazi preko nje u skrolu) — ako
smeta, rešenje je scroll-spy sa tamnom varijantom headera.

## Spotlight na kontakt kartici
- Izgled: radijalni gradijent `#106ACA` sa `filter: blur(64px)` i tri stopa,
  bez vidljive ivice kruga.
- Kretanje: lerp, 12% razlike po frejmu (`EASE` u `contact.js`). Sjaj stiže za
  mišem umesto da lepi za njega. Petlja radi samo dok je miš na kartici i gasi
  se čim sjaj stigne na cilj, pa nema rada u pozadini.
- Na `pointerenter` se pozicija postavlja odmah na ulaznu tačku, da se sjaj ne
  vuče preko cele kartice sa mesta gde je miš bio prošli put.
- Uz `prefers-reduced-motion` sjaj ostaje na sredini i ne prati kursor.

## Zaključavanje skrola dok je meni otvoren
- `body[data-menu-status="open"] { overflow: hidden }` u `base.css`. Atribut već
  postavlja `nav.js`, pa nije trebala nova logika.
- `html { scrollbar-gutter: stable }` drži mesto za scrollbar i dok je skrol
  zaključan — bez toga bi stranica i fiksirani elementi poskočili za ~15px.
  Provereno: sadržaj, širina headera i pozicija menija su identični pre i tokom
  zaključavanja.
- `.underlay-nav__inner` ima `overflow-y: auto` + `overscroll-behavior: contain`,
  pa meni skroluje samo kad mu sadržaj ne stane, i taj skrol se ne preliva na
  stranicu iza.

**Napomena za testiranje:** `overflow: hidden` blokira samo korisnički skrol.
`window.scrollBy()` iz konzole i dalje pomera stranicu — to nije bag. Za proveru
koristiti pravi wheel događaj.

## Slogan u footeru
Bela od 100% do 0% (`background-clip: text`), `mix-blend-mode: overlay`, opacity 0.5.
Linija iznad copyrighta uklonjena, copyright centriran.

`.site-footer__inner` je morao da dobije `background-color: var(--c-ink)` —
`container-type: inline-size` na njemu pravi stacking context, pa bi bez sopstvene
podloge `mix-blend-mode` blendovao u prazno umesto u navy footera.

**Rezultat je namerno vrlo suptilan.** Overlay bele preko `#0D1B2A` daje `#1A3654`,
a na 50% opacity ispada `≈ #14283F` — jedva svetliji navy koji se gubi ka dnu.
Ako treba više prisustva: `mix-blend-mode: screen` ili veći opacity su jedina
izmena (`footer.css`, `.site-footer__word`).

## Obraćanje: svuda "vi"
Ceo sajt je prebačen na formalno obraćanje (odluka od 25.8.2026).
Prevedeni su opisi usluga, kontakt sekcija, FAQ, sve CTA dugmad i poruke o
greškama u `contact.js`.

**Namerno ostavljeno u imperativu:** kratke funkcionalne labele — "Meni" / "Zatvori"
na toggle dugmetu, "Zatvori" na modalu i aria-labele "Otvori meni" / "Zatvori meni".
U srpskom UI-ju su to oznake kontrole, a ne obraćanje; "Zatvorite" na malom dugmetu
zvuči usiljeno i šire toggle koji je kalibrisan po Figmi.

**Odstupanje od Figme:** tri CTA teksta su sada u "vi" formi, a u dizajnu su u "ti" —
hero dugme, stavka menija i link u footeru ("Zakažite" umesto "Zakaži").

## Pravne stranice
`politika-privatnosti.html` i `uslovi-koriscenja.html` — stil u `assets/css/legal.css`.
Nav i footer su izvučeni iz `index.html` skriptom i linkovi prepravljeni na
`index.html#sekcija`, da se sadržaj ne raziđe. **Pri svakoj izmeni menija ili
footera, izmena mora ručno u sva tri fajla** — statički sajt nema templating.

### !! Popuniti pre objavljivanja
Sva mesta su u tekstu obeležena žutom pozadinom (`.legal__fill`) da se ne mogu
promašiti — 7 u politici, 6 u uslovima:
- pun poslovni naziv, adresa sedišta, matični broj, PIB
- rok čuvanja podataka ako ne dođe do saradnje
- naziv hosting/email provajdera i da li su serveri van Srbije
- grad nadležnog suda

**Ovo je nacrt, ne pravni savet.** Tekst je pisan prema Zakonu o zaštiti podataka
o ličnosti („Sl. glasnik RS", br. 87/2018), ali ga treba da pogleda pravnik pre
objavljivanja.

Sadržaj odgovara stvarnom stanju sajta: nema kolačića ni analitike, jedina
eksterna konekcija je GSAP sa jsDelivr CDN-a (i to je navedeno u politici).

## GSAP animacije
Dodati pluginovi sa istog CDN-a: **ScrollTrigger** i **SplitText**. Oba su besplatna
od Webflow akvizicije — nema auth tokena ni privatnog registra.

### Hero tilt — UKLONJEN
Cursor-driven perspective tilt je sklonjen na zahtev (25.8.2026). Obrisan je
`assets/js/hero-tilt.js`, njegova skripta iz `index.html` i `perspective` sa
`.hero`. Ako se ikad vraća: perspektiva ide na `.hero`, rotira se samo kartica,
namerno bez `transform-style: preserve-3d` (deca kartice su na `z-index: -1`).

### Split linije (`split-lines.js`)
Po demou https://demos.gsap.com/demo/responsive-line-splits-on-scroll/
- `SplitText.create()` sa `type: "lines"`, `mask: "lines"`, `autoSplit: true`.
  Animacija se pravi **unutar `onSplit()` i vraća** — tako je SplitText sam čisti
  i sinhronizuje pri ponovnom deljenju.
- Meta: `[data-split]` — hero naslov i podnaslov, plus naslov i lead sve tri sekcije.
- **`text-wrap: balance` je uklonjen** sa `.hero__title` i `.section-title` —
  zvanično uputstvo kaže da ometa deljenje. Prelomi se nisu promenili: hero je i
  dalje 3 reda kao u Figmi, naslovi sekcija po 2.
- `.has-js [data-split] { visibility: hidden }` sprečava bljesak nepodeljenog
  teksta; klasu `is-split` postavlja skripta — i kad animira i kad je reduce-motion
  pa samo otkriva.
- `document.fonts.ready` → `ScrollTrigger.refresh()`, jer font je TTF sa
  `font-display: swap` pa se prelomi menjaju kad stigne.

**Napomena za testiranje:** u sakrivenom tabu GSAP ticker stoji i `requestAnimationFrame`
ne okida, pa animacije izgledaju „mrtvo". To nije bag — proveriti u vidljivom prozoru.

## Smooth scrolling (ScrollSmoother)
Po demou https://demos.gsap.com/demo/smooth-scrolling/

### Struktura — najvažnije
Sav sadržaj koji se skroluje je u `#smooth-wrapper > #smooth-content`.
**Fiksirani elementi MORAJU da ostanu izvan omotača**, inače ih transformacija
sadržaja pomera zajedno sa stranicom. Napolju su: skip link, ceo `.underlay-nav`
(header, panel, overlay) i `<dialog>` modal. Provereno na sve tri stranice.

Kad se dodaje nova fiksirana stvar, mora izvan `#smooth-content`.

### Šta je moralo da se prilagodi
- **`scroll-behavior: smooth` uklonjen** iz `base.css` — native smooth se
  suprotstavlja smootheru.
- **Sidrni linkovi** se presrећu u `smooth-scroll.js` i idu kroz
  `smoother.scrollTo()` sa odmakom za header (`visina headera + 24px`).
  Bez toga native skok zaobiđe smoother i raspadne sinhronizaciju.
- **Zaključavanje skrola** — `body { overflow: hidden }` **ne zaustavlja**
  ScrollSmoother. Zato `smoother.paused(true)` na dva mesta: otvaranje menija
  (`nav.js`) i otvaranje modala projekta (`portfolio.js`).
- **Portfolio "Prikažite manje"** vraća pogled kroz `smoother.scrollTo()` umesto
  `window.scrollTo`.

Druge skripte do instance dolaze preko `ScrollSmoother.get()`, bez globalne
promenljive.

### Podešavanja
`smooth: 0.8`, `smoothTouch: 0` (na dodir native skrol — brže i prirodnije),
`ignoreMobileResize: true` (adresna traka na mobilnom ne izaziva refresh).

**Skok na sidro preko cele stranice traje oko dve sekunde** jer je lerp
asimptotski. To je priroda smooth skrola; jedini regulator je `smooth` vrednost.
Probao sam da to ubrzam sopstvenim tweenom uz privremeno `smooth(0)` — pravi
više štete nego koristi (dva easinga se slažu, stanje se lako pokvari), pa je
vraćeno na dokumentovani `smoother.scrollTo()`.

## Scramble na sloganu u footeru
Po demou https://demos.gsap.com/demo/text-scrambling/
Okida se jednom, kad footer uđe u kadar (`start: "top 75%"`, `once: true`).
Opacity slogana podignut sa 0.5 na **0.7** (tagline i copyright ostaju 0.5).

### Zašto je chars baš "ifrtz"
Slogan je veličinom podešen da tačno ispuni kontejner (`13.742cqw`), a span ima
`overflow: hidden` zbog vertikalnog reza — pa se svako šire mešanje seče s desne
strane. Izmerio sam širine glifova u ovom fontu; ciljna prosečna širina znaka je
**30.6px**:

    razmak 14.7 · l 15 · i 16 · j 18.3 · f/r/t 26.3 · z/ž 35.5 · s 37.6
    k 38 · v 39.6 · a 40.3 · e 43.1 · b/d/p 44.6 · o 45.1 · m 63.2

Sva slova iznad 30.6px neizbežno prelivaju. Simulacija na 3000 nasumičnih uzoraka
od 17 znakova:

| chars | prosek | maks | preliva |
|---|---|---|---|
| `izaberpvtok` (slova rečenice) | 116% | 139% | **98%** |
| `frtzs` | 98% | 112% | 29% |
| `ifrtzs` | 90% | 109% | 3.5% |
| **`ifrtz`** | 84% | 99.1% | **0%** |

Prvi pokušaj je bio mešanje slovima same rečenice — delovalo je logično, ali je
prelivalo u skoro svakom kadru. Ako se ikad promeni font ili tekst slogana, ovu
tabelu treba ponovo izmeriti.

## Širina sajta
`--container` je podignut sa **1320px (Figma) na 1824px**. Svi kontejneri ga
koriste, pa se ceo sajt proširio proporcionalno. Provereno: hero je 1306px na
ekranu 1440, 1785 na 1920, i staje na tačno 1824 na 2400. Nigde nema
horizontalnog overflow-a.

**Ostalo namerno fiksno:** `hero__title` (582.296px) i `hero__lead` (445.337px)
zadržavaju mere iz Figme. Da su skalirane sa kontejnerom, hero naslov bi se
prelomio na dva reda umesto na tri kao u dizajnu. Posledica je da na vrlo širokim
ekranima hero blok teksta deluje uže u odnosu na karticu — ako to smeta, te dve
vrednosti su jedino što treba promeniti.

## Portfolio — beskonačni slajder
Po demou https://demos.gsap.com/demo/infinite-card-slider/

- **Kartice se ne dupliraju.** Svakoj se x računa kao `wrap(pozicija + i * širina)`
  preko `gsap.utils.wrap()`, pa kad ispadne levo, ponovo ulazi zdesna. Broj radova
  je zato nebitan — devet ili devedeset, logika je ista.
- Pomeraju je tri izvora: lagano automatsko klizanje (`gsap.ticker`), prevlačenje
  (`Draggable`) i inercija posle puštanja (`InertiaPlugin`). Klizanje staje dok je
  miš nad slajderom ili dok se prevlači.
- `dragClickables: false` da dugme oka ostane klikabilno,
  `allowNativeTouchScrolling: true` da vertikalni skrol stranice ne bude zarobljen.
- Slajder je **pune širine, van kontejnera**, da kartice izlaze izvan oba ruba.
- Naziv i kratak opis projekta su **na kartici**, preko gradijenta; zaglavlje
  sekcije je centrirano (`.section-head.is--centered`), eyebrow uklonjen.

**Merenje širine kartice ide kroz `ResizeObserver`**, jer je širina `23vw` pa se
menja sa viewportom. Prvo sam merio samo na `DOMContentLoaded` i kartice su se
preklapale (korak 260px na kartici od 291px). Dodat je i direktan poziv plus
merenje na `load`, jer ResizeObserver ne pomaže ako je element u tom trenutku
širok 0 (sakriven tab).

**Uklonjeno sa starim gridom:** otvaranje na "Pogledajte više", gradijent preko
drugog reda i `inert` na odsečenim karticama — slajder sve to više ne koristi.

## Visina hero sekcije
Kad je `--container` porastao na 1824px, `aspect-ratio` iz Figme (1.784) je davao
karticu preko 1000px visine — hero je bio veći od ekrana.

Rešeno sa `max-height: 72svh` na `.hero__card` plus manji gornji padding sekcije
(`clamp(4.5rem, 6vw, 5.5rem)` umesto `clamp(5.5rem, 8.3vw, 7.5rem)`).
`width: 100%` je i dalje obavezan — bez njega bi `max-height` preko aspect-ratio
razvukao i širinu, isti bag kao ranije sa `min-height`.

| ekran | pre | posle |
|---|---|---|
| 1440×900 | 732 | 648 |
| 1920×1080 | 1000 | 778 |
| 2400×1350 | 1022 | 972 |
| 1280×800 | 650 | 576 |

Kartica sada uvek zauzima 72% visine ekrana, a cela hero sekcija staje u kadar
na svim proverenim veličinama.

## Reveal: na skrol ili na učitavanje
`reveal.js` sada razlikuje dva ponašanja:

- `[data-animate]` — otkriva se kad element uđe u kadar (IntersectionObserver)
- `[data-animate][data-animate-on="load"]` — otkriva se odmah po učitavanju

Tri kartice ispod hera koriste drugo, da ulaze zajedno sa hero sekcijom umesto
da čekaju skrol. Otkrivanje ide u `requestAnimationFrame`, da se skriveno stanje
jednom iscrta pa da CSS prelaz ima šta da animira; stagger preko `--i` ostaje.

Ako neka buduća sekcija treba isto, dovoljno je dodati `data-animate-on="load"`.

## Portfolio: pravi radovi
Kartica 1 je pravi projekat — **Fabrika poklona, Logo dizajn / Brend identitet**.
Slika `fabrika-poklona.jpg` (684×946), konvertovana iz PNG-a: 954 KB → 74 KB.

- Originalni `fabrika-poklona.png` je i dalje u `assets/img/` — **obrisati pre
  objavljivanja**, ne koristi se nigde.
- U meta pilulama nema godine, jer je ne znam. Ostale kartice imaju godinu iz
  placeholder podataka.
- Opisi u modalu su i dalje filler tekst.

`.work-modal__img` je prebačen sa `cover` na **`contain`** uz tamnu podlogu.
Sa `cover` se portretni mockup sekao na trećinu visine — video se samo pojas
crne table, bez logotipa. Sada se vidi ceo rad, bez obzira na format.
Kartice u slajderu i dalje koriste `cover`, tamo je kadriranje poželjno.

Kartica 2 je **Casa Inženjering** — sajt za građevinsku firmu.
Slike u `assets/img/casa-inzenjering/` (~1.2 MB, sa 2.1 MB posle optimizacije).
Folder je preimenovan iz „Casa inzenjering" — razmak u imenu bi u URL-u morao
da se kodira kao `%20`.

Case study ovde ima samo hero + uvod + Primena. Sekcije Tipografija / Boje /
Logo nisu popunjene jer za taj projekat nemam specifikacije — ne izmišljam ih.

Kartica 3 je **SUB8 Media** — brend identitet za YouTube kanal o recenzijama
sportskih automobila. Slike u `assets/img/sub8-media/` (428 KB, sa 2 MB).
Fajlovi su preimenovani iz `Cropped_T-Shirt_Mockup.jpg`, `Sub8-main img.png` i
sličnih — imali su razmake i velika slova.

**Boje u case study-ju nisu procenjene nego uzorkovane** iz same slike logotipa
preko `System.Drawing.GetPixel`: `#FBD904` (žuta podloga) i `#121212` (crna).

Kartica 4 je **Hedera Cleaning** — sajt za firmu koja radi dezinfekciju enterijera
i klima sistema koloidnim srebrom. Slike u `assets/img/hedera-cleaning/` (272 KB).

Kartice 5–9 su i dalje generisani placeholderi (`work-5..9.jpg`).

## Case study popup (template za projekat)
Figma node `15:2`. Sadržaj popupa je u `<template data-work-details>` unutar
kartice rada; `portfolio.js` ga klonira u modal. Stilovi: `assets/css/case.css`.

Struktura je preuzeta iz Figme jer je dobra:
hero → badge + naziv + opis → **Tipografija** → **Boje** → **Logo** → **Primena**.
Prve dve sekcije su dvokolonske (naslov levo, sadržaj desno), druge dve preko
cele širine. Modal je proširen sa 56rem na **72rem** zbog količine sadržaja.

Asseti su u `assets/img/fabrika-poklona/` (~670 KB ukupno): 4 mockupa u JPG-u i
4 SVG varijante logotipa. Brend boje klijenta (`#1C1C1C`, `#DCB654`) se
prosleđuju inline preko `--swatch` / `--swatch-ink`, jer su podatak o projektu
a ne token sajta — zato ih nema u `base.css`.

**Za sledeći projekat** dovoljno je kopirati template i zameniti slike i tekst;
CSS ne treba dirati. Kolone logotipa (`500fr 308fr 830fr`) su iz Figme — ako
neki projekat ima drugačiji broj varijanti, menja se samo ta linija.

### Dva bug-a koja su iskrsla
- **`aspect-ratio` na `<img>` ne radi bez `height: auto`.** Atribut `height="1200"`
  ostaje kao prezentacioni hint, visina nije `auto`, pa se `aspect-ratio`
  ignoriše — hero je bio 1137×1200 umesto 1137×569. Isti obrazac važi svuda gde
  se na slici kombinuju `width` + `aspect-ratio`.
- **Grid stavke imaju `min-height: auto`**, pa `max-height: 100%` ne skuplja SVG
  ispod prirodne visine. Logotipi su prelivali kartice dok nisu dobili
  `min-width: 0; min-height: 0`.

### Otvoreno
- **Font FinalSix Heavy nemam**, pa je specimen ispisan fontom sajta uz napomenu.
  Ako pošalje `.woff2`/`.otf`, menja se samo `font-family` na `.case__typeface`.
- Ispravljeni typo-i iz Figme: „Bend identitet" → „Brend identitet",
  „Bizni" → „Biznis", „rodjendani" → „rođendani".
- Figma export etikete (`15:82`) vraćao je **praznu belu sliku** — taj mockup je
  uzet renderovanjem node-a preko `get_screenshot`, ne preko asset URL-a.

## Casa Inženjering — otvorena pitanja
- **Obim posla.** Marko je rekao „sajt", ali među slikama su i vizit karta,
  memorandum, koverta i flajer. Ako je rađen i print, oznaka na kartici
  („Web dizajn / Web development") treba da bude šira.
- **Godina** nije upisana — nemam podatak.
- Na vizit karti se vidi domen **casainzenjering.rs**. Ako je sajt živ, u case
  study bi mogao link „Poseti sajt" — nisam dodavao bez potvrde.
- Vizit karta sadrži ime i mejl klijentovog zaposlenog. Slika je Markova i ostaje
  kakva jeste, ali mejl nisam prepisivao u tekst stranice da ne bude indeksiran.
- Sve četiri slike su **pejzažne**, a kartica u slajderu je 3:4 portret, pa se
  kadrira dosta sa strane. Čita se dobro (vidi se naslov sajta), ali bi zaseban
  portretni thumbnail bio bolji.

## SUB8 Media — otvorena pitanja
- **Godina** nije upisana — nemam podatak.
- Oznaka na kartici je „Logo dizajn / Brend identitet". Ako je rađen i sam merč
  (a ne samo dizajn koji je odštampan), oznaka treba da bude šira.
- U case study-ju nema sekcije **Tipografija** ni **Logo** — nemam ime fonta, a
  logo je već hero slika pa bi zasebna sekcija bila duplikat. Na kačketu i na
  etiketi majice postoji i **S8 monogram**; ako ga pošalje kao zaseban fajl,
  sekcija Logo ima smisla (dve varijante na svetloj i tamnoj podlozi).
- Thumbnail kartice je majica. Kačket je jače kadriran za 3:4 (žut, centriran)
  ako se ispostavi da majica slabo čita u slajderu.

## Hedera Cleaning — napomene
- Dve slike su ostale **WebP** (laptop, tablet) jer `System.Drawing` ne ume da ih
  otvori, a i nema potrebe — već su male (107 KB i 59 KB). PNG telefona je
  prebačen u JPG: 499 KB → 100 KB.
- **`.webp` je dodat u MIME mapu u `serve.ps1`** — bez toga se servirao sa praznim
  Content-Type. Pregledači bi ga i tako pogodili, ali na pravom hostingu treba
  proveriti da je `image/webp` podešen.
- **Nema sekcije Boje.** Pokušao sam da uzorkujem brend zelenu iz mockupa, ali
  merenja se ne slažu (`#42F274` najzasićeniji piksel, `#35A952` prosek dugmeta,
  `#32823E` prosek logotipa) — to su screenshot-ovi unutar foto-mockupa, pa
  anti-aliasing i senčenje ekrana kvare uzorak. Za razliku od SUB8, gde je logo
  ravna površina boje pa je uzorak pouzdan. Ako pošalje brend zelenu ili ravan
  logo asset, sekcija se dodaje kao kod SUB8.
- **Godina** nije upisana.

### Sitna CSS izmena
`.case__shots li:last-child` → `.case__shots li:last-child:nth-child(odd)`.
Hedera ima samo dve slike u galeriji; po starom pravilu bi se druga razvukla
preko cele širine. Sada se puna širina daje samo kad bi poslednja inače ostala
sama u redu. Galerije sa tri slike (Fabrika, Casa, SUB8) izgledaju isto kao pre.
