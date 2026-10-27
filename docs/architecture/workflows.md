# Fluxul de autentificare și API

1. `AuthProvider` apelează `auth.session()` la încărcare.
2. `createAuthActions` folosește adaptorul `createAuthApi`, care trimite `GET /api/v1/auth/session` cu cookie-uri.
3. Serverul răspunde cu `{ user: null | PublicUser, csrfToken }`; tokenul este păstrat doar în memoria clientului HTTP.
4. Formularul validează local și trimite `POST /auth/login` sau `/auth/register` cu `X-CSRF-Token`. Serverul validează din nou, verifică Argon2id și regenerează sesiunea.
5. `AuthProvider` actualizează utilizatorul, iar clientul reține noul token CSRF. Cumpărătorul revine în piață sau la checkout; producătorul intră în gospodărie. Redirect-ul acceptă numai căi locale.
6. `ProtectedRoute` protejează navigarea. API-ul deduce identitatea din sesiune și verifică rolul/proprietarul pentru fiecare operație privată.
7. Logout trimite o cerere protejată CSRF, invalidează sesiunea pe server și golește coșul contului. La refresh, utilizatorul este recitit din sesiune.

Clientul nu reîncearcă automat cereri de scriere. Un token CSRF expirat este invalidat local; utilizatorul poate reîncerca explicit. La o comandă, cheia de idempotență este aceeași pentru retry al unui payload identic și se schimbă când se schimbă produsele, cantitățile sau ridicarea.

## Cum adaugi o funcționalitate

Adaugă regulile pure în `domain/features/<nume>`, operațiile în `application/features/<nume>`, adaptorul HTTP în `infrastructure/features/<nume>` și pagina în `presentation/features/<nume>`. Conectează adaptorul în `app/container/services.js`. Extrage UI comun doar când există o responsabilitate reutilizabilă: Button, Field, feedback și încărcare.

Datele API au o singură cale de încărcare prin `useResource`. Funcția de încărcare este stabilă cu `useCallback`; AbortController și verificarea semnalului opresc răspunsurile vechi. Stările de încărcare sunt derivate din identitatea cererii, fără copii globale ale catalogului.
