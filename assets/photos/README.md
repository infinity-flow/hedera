# Fotografije za sajt

Sve fotografije na sajtu su na mestu. Da biste neku zamenili, ubacite novu **pod istim nazivom** (isti format, slično kadrirana).

| Fajl | Sekcija | Format |
|---|---|---|
| `uredjaj-kabina.jpg` (+ `uredjaj-kabina-1200.webp`, `uredjaj-kabina-2000.webp`) | Tehnologija | 3:2 (na desktopu prikazano 540 px visine) |
| `vozilo-automobil.jpg` | Za svako vozilo | 4:5, 800×1000 px |
| `vozilo-kombi.jpg` | Za svako vozilo | 4:5, 800×1000 px |
| `vozilo-kamion.jpg` | Za svako vozilo | 4:5, 800×1000 px |
| `vozilo-autobus.jpg` | Za svako vozilo | 4:5, 800×1000 px |

Saveti:
- JPG, veličina fajla po mogućstvu ispod ~300 KB.
- Fotografija se iseče po sredini, pa važan sadržaj držite u centru kadra.
- Ako zamenite `uredjaj-kabina.jpg`, zamenite i obe WebP verzije (ili ih obrišite i uklonite `<source>` red iz `index.html`), jer pregledači prvo učitavaju WebP.
- Ako neki fajl nedostaje, na njegovom mestu se prikazuje polje sa opisom kadra; `showPhotoPlaceholders: false` u `script.js` takvo mesto sakriva.
