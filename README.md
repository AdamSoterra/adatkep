# Adatkép

Független, pártatlan adatvizualizáció Magyarországról és Közép-Európáról.

🌐 [adatkep.hu](https://adatkep.hu) · 📷 [@adatkep](https://instagram.com/adatkep)

## Stack

Tiszta HTML + CSS + minimális JavaScript. Semmi build step.

- Static HTML — minden oldal egy `.html` fájl
- Brand-tokenizált shared CSS (`assets/style.css`)
- Vanilla JS PWA registrationhoz (`assets/app.js`)
- PWA: `manifest.json` + `sw.js` (offline-first cache)
- Vercel: static deploy `vercel.json` config-gal

## Struktúra

```
site/
├── index.html              # Homepage
├── rolunk.html             # About
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── vercel.json             # Vercel config (clean URLs, headers)
├── assets/
│   ├── style.css           # Shared brand CSS
│   ├── app.js              # PWA registration + small JS
│   ├── icon.svg            # Favicon
│   ├── icon-192.svg        # PWA icon
│   └── icon-512.svg        # PWA icon
└── adatkep/                # Individual data viz posts
    └── orvoshiany.html
```

## Új adatkép hozzáadása

1. Másold le `adatkep/orvoshiany.html`-t és nevezd át (pl. `adatkep/lakossag.html`)
2. Cseréld a `<title>`, `og:`, `<h1>` és tartalmi részt
3. A diagramot építsd a meglévő `.bar-row`, `.chart` osztályokból (lásd `style.css`)
4. Add hozzá a homepage-en a `.post-grid`-be egy új `<a class="post-card">` linkkel
5. Commit + push → Vercel auto-deployolja

## Branding

| Token | Hex | Használat |
|---|---|---|
| `--ink` | `#0E1A24` | Fő szövegszín, sötét háttér |
| `--paper` | `#F7F4EE` | Háttér |
| `--accent` | `#0F8B8D` | Kiemelés, számok, linkek |
| `--muted` | `#6B7785` | Szekunder szöveg |
| `--rule` | `#D8D2C7` | Vonalak, határok |
| `--warn` | `#C44536` | Negatív delták |

Tipográfia: **JetBrains Mono** (display, számok) + **Inter Tight** (body).

## Deploy

GitHub repo → Vercel auto-deploy. Domain: `adatkep.hu` Tárhely.eu-n regisztrálva, DNS Vercelre mutat.
