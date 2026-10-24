# DinSat Frontend

Interfața DinSat, pregătită pentru **React și JavaScript**, cu Vite ca instrument de dezvoltare propus. Este un submodul Git separat, disponibil în `src/din_sat_front` din proiectul principal.

În această etapă există doar structura de directoare și fișiere `.gitkeep`. Nu există încă implementare, dependențe, configurare sau comenzi de pornire; `package.json` va fi adăugat la inițializarea aplicației.

## Organizare

Folosim Clean Architecture cu organizare mai întâi pe straturi. Directoarele `domain`, `application`, `infrastructure` și `presentation` apar o singură dată în `src/`. În fiecare strat, `features/` grupează fișierele după funcționalitate.

```text
din_sat_front/
├── public/                        # Fișiere statice servite direct
├── src/
│   ├── app/
│   │   ├── router/                # Rute și navigare
│   │   ├── providers/             # Context și furnizori React la nivel de aplicație
│   │   ├── config/                # Configurație publică, inclusiv adresa API-ului
│   │   └── container/             # Conectarea cazurilor de utilizare la adaptoare
│   ├── domain/
│   │   └── features/              # Modele și reguli independente de UI
│   ├── application/
│   │   └── features/              # Cazuri de utilizare și porturi pentru API / stocare
│   ├── infrastructure/
│   │   ├── features/              # Adaptoare API, mapări DTO și stocare pe funcționalități
│   │   └── http/                  # Client HTTP și tratarea comună a erorilor API
│   ├── presentation/
│   │   ├── features/              # Pagini, componente, hook-uri și stare React
│   │   └── shared/
│   │       ├── ui/                # Controale vizuale reutilizabile
│   │       ├── hooks/             # Hook-uri generale pentru UI
│   │       └── styles/            # Stiluri globale și variabile vizuale
│   ├── shared/
│   │   └── lib/                   # Utilitare independente de React
│   └── assets/
│       ├── images/
│       ├── icons/
│       └── fonts/
├── docs/
│   └── architecture/
└── tests/
    ├── unit/
    ├── components/
    ├── integration/
    ├── e2e/
    └── fixtures/
```

Fiecare director `features/` din cele patru straturi conține aceleași funcționalități:

```text
features/
├── auth/
├── catalog/
├── producers/
├── cart/
├── orders/
├── pickup/
├── dashboard/
├── ai/
└── billing/
```

De exemplu, autentificarea are modelele și regulile locale în `src/domain/features/auth/`, cazurile de utilizare și porturile în `src/application/features/auth/`, adaptoarele API în `src/infrastructure/features/auth/` și componentele React în `src/presentation/features/auth/`. Fișierele necesare vor fi adăugate în directorul funcționalității din stratul corespunzător; momentan fiecare conține doar `.gitkeep`.

Directoarele interioare se adaugă când apare codul care le justifică. De exemplu, `presentation/features/auth/` poate primi ulterior `pages/`, `components/` și `hooks/`.

## Reguli de dependență

- `domain` conține JavaScript independent de React, HTTP și API-urile browserului.
- `application` folosește domeniul și definește contractele pentru operațiile externe. Nu importă componente sau implementări HTTP.
- `infrastructure/features/<nume>/` implementează aceste contracte prin clientul din `infrastructure/http/` sau prin stocarea browserului. Maparea răspunsurilor API în modele locale se face aici.
- `presentation` afișează datele și apelează cazurile de utilizare. Hook-urile React și starea UI rămân aici.
- `app/container` conectează adaptoarele la cazurile de utilizare; `app/providers` le face disponibile interfeței.
- Funcționalitățile comunică prin contracte explicite; nu importă componente sau adaptoare interne ale altor funcționalități. `shared/lib/` conține utilitare independente de straturile aplicației; `presentation/shared/` conține elemente UI comune, fără dependențe de funcționalități sau `app`.

Fluxul unei acțiuni: componentă / hook → caz de utilizare → port → adaptor API → backend. Adaptorul concret este conectat din `app`.

Pentru ecrane simple, logica poate rămâne minimală. Nu sunt necesare clase, repository-uri sau abstracții fără o responsabilitate concretă.

## Funcționalități

| Funcționalitate | Responsabilitate |
| --- | --- |
| `auth` | Înregistrare, autentificare și sesiunea curentă |
| `catalog` | Listarea, filtrarea și detaliile produselor |
| `producers` | Profilul producătorului și administrarea ofertei |
| `cart` | Coșul și selecția temporară de produse |
| `orders` | Checkout, istoricul și detaliile comenzilor |
| `pickup` | Alegerea și administrarea punctelor / intervalelor |
| `dashboard` | Afișarea statisticilor producătorului |
| `ai` | Conversația și confirmarea propunerilor de cumpărături |
| `billing` | Afișarea planurilor și a abonamentului curent |

## API, date și stare

Frontend-ul accesează backend-ul exclusiv prin HTTP. Contractul canonic va fi în `docs/api/` din repository-ul `din_sat_api`; frontend-ul nu păstrează o copie editată independent și nu importă fișiere din backend.

Frontend-ul nu se conectează direct la baza de date. Tehnologia și schema acesteia se stabilesc separat, în spatele API-ului. Cheile private pentru baza de date, AI și plăți aparțin backend-ului.

Starea temporară a interfeței rămâne în componente sau hook-uri; filtrele partajabile pot sta în URL. Coșul poate avea reducerul pur în `domain/features/cart/` și providerul React în `presentation/features/cart/`. Totalurile afișate sunt orientative până la validarea serverului; prețurile finale, stocul și permisiunile sunt stabilite de backend.

## Lucrul în submodul

Modificările se salvează în repository-ul `din_sat_front`. După publicarea commit-ului copil, repository-ul principal poate actualiza referința către versiunea frontend verificată împreună cu API-ul.

Fișierele `.gitkeep` păstrează directoarele goale în Git și pot fi eliminate când directoarele primesc conținut.
