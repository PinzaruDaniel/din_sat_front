# DinSat Frontend

Marketplace în React 19 + JavaScript, Vite, React Router și Lucide. Structura existentă cu patru straturi este păstrată. Interfața este în română, adaptată pentru desktop și mobil.

## Pornire

Node.js 24 sau mai nou. Pornește mai întâi API-ul din `../din_sat_api`.

```bash
npm ci
cp .env.example .env
npm run dev
```

Deschide `http://localhost:5173` (aceasta este originea permisă implicit de API). Vite transmite `/api` către `http://127.0.0.1:3001`. Dacă deschizi frontend-ul prin alt hostname sau port, setează și `APP_ORIGIN` pe backend. `API_PROXY_TARGET` configurează proxy-ul doar la development; `VITE_API_BASE_URL` este adresa publică, implicit `/api/v1`. Nu introduce secrete în variabile `VITE_*`.

Cont demo: `buyer@dinsat.demo` / `DinSatDemo2026!`. Există și `producer@dinsat.demo`, cu aceeași parolă. Poți înregistra alte conturi de cumpărător sau producător. Datele demo și sesiunile se pierd la repornirea API-ului.

## Fluxuri implementate

- Catalog cu filtre combinate în URL, sortare, paginare și anularea cererilor vechi.
- Detalii produs și profil public al producătorului.
- Înregistrare buyer/producer, login, restaurarea sesiunii la refresh și logout.
- Formulare cu etichete, validare și erori API, plus afișarea/ascunderea parolei.
- Rute protejate și navigare după rol; autorizarea reală se verifică și pe server.
- Coș temporar, cu un singur producător, cantități limitate și total estimat.
- Coșul vizitatorului se păstrează la primul login; logout sau schimbarea contului îl golesc. Coșul este intenționat în memorie și se pierde la un refresh complet.
- Checkout cu interval real de ridicare și cheie de idempotență păstrată la retry.
- Istoric, anulare și statusuri ale comenzilor.
- Producător: publicare de produse, configurare de ridicări în ora Moldovei și pregătirea/finalizarea comenzilor.

AI și billing sunt extensii viitoare. Parola uitată, verificarea emailului, upload-ul de imagini, editarea profilului și administrarea avansată a produselor nu sunt implementate. Imaginile curente folosesc URL-uri HTTPS; fotografiile demo sunt de pe Unsplash, iar fonturile web de pe Google Fonts, cu fallback local.

## Verificări

```bash
npm run lint
npm test
npm run build
npm run format:check
```

Pentru verificare în browser, cu API-ul și frontend-ul pornite:

```bash
npx playwright install chromium
npm run test:e2e
```

Scenariile verifică filtrarea, login, checkout, refresh, anulare, logout, publicarea, ridicarea și finalizarea comenzilor, plus pagini la 360 px. `node scripts/capture-preview.mjs` salvează capturi în `/tmp/dinsat-preview`; poți seta `PREVIEW_OUTPUT`.

## Organizare

`domain/features/` conține reguli pure: validarea locală a credențialelor, reducerul coșului și conversia datei de ridicare. `application/features/` definește operațiile folosite de UI. `infrastructure/features/` le implementează prin clientul HTTP comun. `presentation/features/` conține pagini și componente; `presentation/shared/` conține controale și hook-uri generale. `app/container/` injectează adaptoarele, `app/providers/` compune furnizorii, iar `app/router/` declară rutele.

Flux: componentă / hook → operație de aplicație → adaptor HTTP → API. Clientul HTTP gestionează cookie-urile, CSRF și erorile. Sesiunea nu folosește tokenuri în localStorage. Frontend-ul nu importă cod backend și nu se conectează direct la DB.

Contractul canonic este în `../din_sat_api/docs/api/openapi.yaml`. Regulile, prețurile, stocul și identitatea sunt validate de server.
