# Product Spec — finQ Home Assignment (Random User Profiles)

This document resolves every implicit/ambiguous point in the original brief so a tech spec can be written from it without re-litigating product decisions. 
See `DECISIONS.md` for the tradeoff writeups behind the choices marked **[Decision]** below.

## 1. Scope & stack

- **Backend:** Node + TypeScript, SQLite via `better-sqlite3` (no ORM) **[Decision]**
- **Frontend:** Vue 3, Composition API, Pinia for state **[Decision]**
- **UI:** shadcn-vue (Tailwind + Radix/Reka primitives) **[Decision]**
- **Data source:** `https://randomuser.me/api/?results=10` for the random batch
- Two clearly separated folders: `client/` and `server/`, each with its own `README.md` (prerequisites, install/run, env vars)

## 2. Data model

**Canonical identity:** `login.uuid` from randomuser.me is used as the identity key everywhere — including the backend's primary key. A saved profile and its random-fetch counterpart are the same entity by this key. **[Decision]**

**Profile fields** (superset needed across all screens, all come from a single randomuser.me person object):
- `uuid` (identity key)
- `picture` (thumbnail + large)
- `name`: title, first, last
- `gender`
- `location`: country, city, state, street.number, street.name
- `email`, `phone`
- `dob`: age, date (for year of birth)

**Backend storage schema** (`users` table): flattened/JSON-serialized version of the above, keyed by `uuid`.

## 3. State architecture

Two independent Pinia stores — not one unified store — because they have different consistency semantics: **[Decision]**

- **`randomUsersStore`**: holds the current batch of 10 fetched profiles. Client-mutable (Update on an unsaved profile edits this in place). 
Persists across navigation within the session — **fetches only once per session**, not on every visit to Screen 1. 
Each item can carry a local `isSaved: boolean` flag (see §7).
- **`savedUsersStore`**: mirrors the backend. Fetched (or refetched) when Screen 2 is visited. Server is the source of truth; this store is a read cache, not authoritative.

Screen 3 is reached via a route carrying `uuid` + which store to resolve from (not the full serialized object), the actual profile object is read from the relevant store.

## 4. Global navigation

A persistent, lightweight header/nav bar is present on all screens. This is an addition beyond the brief — which only specifies a per-screen "Back" button — noted here as a deliberate UX improvement, not something the spec implies on its own. **[Decision]**

- **Content:** app title/logo, acting as a Home link back to Screen 0. 
- **Behavior:** clicking Home never forces a refetch. Both `randomUsersStore` and `savedUsersStore` keep whatever they already hold (per the "fetch once per session" rule in §3) — returning to Screen 1 via Home shows the same cached list, with filters reset to empty, same as any fresh screen entry.
- **Screen 3 interaction:** navigating Home from Screen 3 discards any unconfirmed local edit to the name field. No "unsaved changes" confirmation dialog, out of scope for this budget.
- **Direction:** the nav bar itself stays LTR/English chrome regardless of Screen 3's RTL form requirement (#6) — it's app-level navigation, not the bidirectional content that requirement describes.

## 5. Screens

### Screen 0 — Home
Two buttons: **Fetch** → Screen 1, **History** → Screen 2. No other logic.

### Screen 1 — Random List
- Fetches 10 people from randomuser.me **exactly once per session**, the first time Screen 1 is entered via Home's Fetch button. No in-screen refresh action, and no re-fetch on subsequent visits (including leaving via Home and clicking Fetch again) — `randomUsersStore` keeps returning the same cached batch for the whole session, consistent with §4. **[Decision]**
- Row shows: thumbnail, name (title+first+last), gender, country, phone, email.
- **Filter:** two separate inputs, name (text) and country (derived dropdown/select from the fetched set's distinct countries). 
Client-side, instant (no debounce), there's no network call to throttle; debounce only makes sense to reduce network chatter, which doesn't apply to filtering 10 already-fetched records in memory. **[Decision]**
- Clicking a row → Screen 3, resolved from `randomUsersStore`.
- Rows already saved in this session show a visual "saved" indicator (from `isSaved` flag) — see §7.

### Screen 2 — Saved Profiles
Identical UI/UX to Screen 1 (same row layout, same two-input client-side filter), but the list comes from the backend (`savedUsersStore`, fetched fresh on entry). No server-side filtering — the saved set is small and "identical" reads as UX parity, not implementation parity. **[Decision]**

### Screen 3 — Profile Detail
Reached from Screen 1 or Screen 2. Shows:
- Large image, gender, editable name field, age + year of birth (derived from `dob`), address (street number + name, city, state), contact (email, phone).
- **Buttons**, conditional on origin:
  - **Save** — visible only if origin is Screen 1 AND not already flagged saved this session. Persists via `POST /api/users`. On success: flip local `isSaved` flag on the `randomUsersStore` item (does **not** mirror into `savedUsersStore` — see §7). Button becomes unavailable after success.
  - **Delete** — visible only if origin is Screen 2 (already in DB). Calls `DELETE /api/users/:uuid`, removes from `savedUsersStore`, navigates back.
  - **Update** — name field is editable inline (not a separate mode).
    - If saved (Screen 2 origin): `PATCH /api/users/:uuid` on submit.
    - If not saved (Screen 1 origin): mutates the `randomUsersStore` item in place, no network call.
  - **Back** — returns to the originating screen without side effects beyond whatever Save/Update/Delete already did.

**No deep-linking:** Screen 3 is not directly navigable via URL refresh — the profile object is read from an in-memory store, not re-fetched by id. A refresh loses the detail view. Documented cut corner (#9). **[Decision]**

## 6. BiDi (RTL/LTR) requirement

Page-level `dir="rtl"` alone is insufficient, it also reorders flex/grid children, not just text direction. Approach: **[Decision]**

- Static field **labels** (Gender, Name, Address, City, State, Email, Phone, etc.) are hardcoded Hebrew strings, and the form's overall layout is RTL.
- **Data fields that must stay LTR** — email, phone, street number, the editable Latin name field — get explicit `dir="ltr"` **and** `text-align: left` on the input itself, plus `direction: ltr` on their wrapping row where needed, so the label/input pairing doesn't visually reverse due to the parent's RTL flex flow.
- **Buttons** (Save/Delete/Update/Back) stay in English, natural left-to-right order — a deliberate exception since they're actions, not RTL-flowing content, not an oversight.

## 7. Save-state edge case (explicit, not left implicit)

After a successful Save from Screen 1, the item **remains visible in Screen 1's list** rather than being removed, but gets a local `isSaved: true` flag on the `randomUsersStore` item to prevent a duplicate Save UI action on re-click. **[Decision]**

Backend `POST /api/users` performs an upsert on `uuid` conflict as defense-in-depth (idempotent write), not because the UI is expected to trigger a duplicate save under normal use.

## 8. API surface

- `GET /api/users` — list saved profiles
- `POST /api/users` — save a profile (body = full profile incl. `uuid`); upsert on conflict
- `PATCH /api/users/:uuid` — update saved profile's name
- `DELETE /api/users/:uuid` — remove saved profile

No `GET /api/users/:uuid` (see #5, no deep-linking).

## 9. Deliberately cut corners (to restate in DECISIONS.md, ≤1 page)

- No deep-linking / no Screen-3 detail endpoint.
- No client-side mirroring of saved-state beyond the local session flag (§7) — accepted stale-button edge case within a session, resolved by backend upsert idempotency.
- No TanStack Query — plain `fetch` + Pinia actions. Would adopt TanStack Query in production for its optimistic-update primitives (`onMutate`/`onError` rollback).
- No ORM (Prisma) — raw SQL via `better-sqlite3` behind a thin repository layer; would move to Postgres + an ORM at real scale.
- No server-side filtering on Screen 2.
- No "unsaved changes" confirmation when navigating Home from Screen 3 (§4).

## 10. Extension (~30 min budget)

**Chosen: automated test(s) over optimistic UI.** **[Decision]**
Optimistic updates require rollback-on-failure and user-visible error handling to be done honestly.
a half-implemented version (update, no rollback) is worse than none, and risks not finishing cleanly in 30 minutes.
**Target:** a focused test on the store's save/update/delete provenance logic (#3, #7),
the most bug-prone conditional code in the app (Vitest, frontend). Backend upsert/idempotency behavior (#7, #8) is a secondary candidate if time remains.
"What I'd build next": TanStack Query's optimistic-update primitives, applied to the Save/Delete actions specifically.

## 11. Out of scope (explicitly, per brief)

No authentication, no RBAC, no full REST maturity (pagination, HATEOAS, etc.) — 3-4 endpoints with clean resource modeling is sufficient per the brief.
