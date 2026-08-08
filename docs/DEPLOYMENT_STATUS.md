# CPM Rent Dubai — deployment status

_Popunjeno 8.8.2026. Referenca: `~/docs/DEFINITION-OF-DONE.md`_

## Osnovno
| Polje | Vrijednost |
|---|---|
| Firma | CPM Rent Dubai |
| Repo | `~/Desktop/kneecare-dubai` |
| Remote | `github.com/valensbot5-alt/CPM-DUBAI.git` |
| **Domena** | **cpmrentdubai.com** (`CNAME` u repou) |
| **Hosting** | **GitHub Pages** |
| **Deploy** | `./deploy.sh "poruka"` → `git add . && git commit && git push` (Pages builda sam) |
| **Baza** | nema — statični HTML |
| **PM2** | n/p |
| **.env** | nema |
| Arhitektura | **SPA** — sve sekcije u `index.html`, navigacija preko `showPage()` |
| Jezici | engleski + arapski (`data-en` / `data-ar` atributi) |
| Stranica | 21 HTML (naslovnica + 20 blogova) |

## Gate status — izmjereno 8.8.2026.

**Automatski screening na živoj stranici: 9/16.** Popravci iz commita `f466d7c` **još nisu deployani**, pa živa stranica ne pokazuje pomak.

| Gate | Živo | U kodu (grana `fix/seo-metapodaci`) |
|---|---|---|
| G3.3 jedan H1 | ❌ 3 H1 | ✅ **21/21** |
| G3.1 title 50–60 | ❌ 0/21 | ✅ **21/21** |
| G3.2 meta 140–160 | ❌ 3/21 | ✅ **21/21** |
| G2.3 canonical | ✅ | ✅ 21/21 |
| G1.4 odziv servera | ✅ **39 ms** | — najbrži u portfelju |
| G1.5 HTML | n/p | SPA — 322 KB je sav sadržaj u jednom fajlu |
| G1.11 Performance | ❌ **66/100** | LCP 5,6 s |
| G2.1 sitemap | ✅ 19 URL-ova | + novi blogovi |
| G2.2 robots.txt | ✅ | |
| G3.6 JSON-LD | ✅ 6 blokova | |
| G4 viewport | ✅ | |
| G5.2 WhatsApp | ✅ 7 pojava | |
| **G6.1 analitika** | ❌ **`G-XXXXXXXXXX`** | **placeholder — ne mjeri ništa** |
| **G5.1 telefon** | ❌ **0 `tel:` linkova** | **stranica ne može primiti poziv** |
| G0.2 placeholderi | ❌ `G-XXXXXXXXXX` | isto |

## Što blokira 16/16

| # | Što | Kod koga |
|---|---|---|
| 1 | **Deploy grane `fix/seo-metapodaci`** | odluka |
| 2 | **Pravi GA4 ID** umjesto `G-XXXXXXXXXX` | treba podatak |
| 3 | **Telefonski broj** za `tel:` link | treba podatak |

Nakon deploya i ta dva podatka: **16/16**. Performance i LCP su po specu zadaci za rujan.

## ⚠️ Blokada za oglašavanje

**Nula budžeta na UAE zdravstveno oglašavanje dok DHA/MOHAP status nije utvrđen.** Kazne idu i klijentu i izvođaču. Označeno NEPROVJERENO u CLAUDE.md od početka.

## Sadržajna rupa

19 od 21 URL-a je blog. **Nema nijedne stranice usluge** — ništa što bi rangiralo na komercijalni upit „rent CPM Dubai". To je veći problem od svih tehničkih nalaza gore.

Također: `hreflang` deklarira samo `en` + `x-default`, a u repou `CPM GLOBAL` postoji i18n za de/en/hr koji nije iskorišten.

## Ručni kriteriji

46 stavki iz `~/docs/RUCNI-CHECKLIST.md`. Prioritet: R6 (DHA/MOHAP), R3 (stiže li mail iz forme), R4 (eventi — trenutno nemoguće, analitika je lažna).
