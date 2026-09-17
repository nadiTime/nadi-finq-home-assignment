# Product Spec — finQ Home Assignment (Random User Profiles)

This document resolves every implicit/ambiguous point in the original brief so a tech spec can be written from it without re-litigating product decisions. 
See `DECISIONS.md` for the tradeoff writeups behind the choices marked **[Decision]** below.

## 1. Scope & stack

- **Backend:** Node + TypeScript, SQLite via `better-sqlite3` (no ORM) **[Decision]**
- **Frontend:** Vue 3, Composition API, Pinia for state **[Decision]**
- **UI:** shadcn-vue (Tailwind + Radix/Reka primitives) **[Decision]**
- **Data source:** `https://randomuser.me/api/?results=10` for the random batch
- Two clearly separated folders: `client/` and `server/`, each with its own `README.md` (prerequisites incl. Node version, install/run, env vars)
- **Deliverables at repo root:** a top-level `README.md` (project overview + how to run both sides — distinct from and in addition to the two per-folder READMEs), `DECISIONS.md` (≤1 page), `AI_USAGE.md` (AI tools used and what for)

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
Each item can carry a local `isSaved: boolean` flag (see #7).
- **`savedUsersStore`**: mirrors the backend. Fetched (or refetched) when Screen 2 is visited. Server is the source of truth; this store is a read cache, not authoritative.

Screen 3 is reached via a route carrying `uuid` + which store to resolve from (not the full serialized object), the actual profile object is read from the relevant store.

## 4. Navigation

No persistent header/nav bar — kept strictly to what the brief specifies: a per-screen
"Back" button, nothing more. **[Decision]** (An earlier draft added a global nav bar as a UX
extra; dropped to stay inside the brief's stated scope rather than invite a "why did you add
this?" question during review.)

- **Screen 0 (Home):** no Back button, it's the root screen. Fetch → Screen 1, History → Screen 2.
- **Screen 1 / Screen 2:** a "Back" button returns to Screen 0. It never forces a refetch —
  both `randomUsersStore` and `savedUsersStore` keep whatever they already hold (per the
  "fetch once per session" rule in #3 for the random store); returning to Screen 1 shows the
  same cached list, with filters reset to empty, same as any fresh screen entry.
- **Screen 3:** "Back" returns to the originating screen (Screen 1 or Screen 2), discarding
  any unconfirmed local edit to the name field that wasn't submitted via Update. No "unsaved
  changes" confirmation dialog, out of scope for this budget.
- **Full page reload (any screen):** resets the SPA to Screen 0. `randomUsersStore` is in-memory only and is lost — any unsaved random batch, and any local edits made to it via Update, are gone. `savedUsersStore` is unaffected since it rehydrates from the backend the next time Screen 2 is visited. This is the general rule Screen 3's "no deep-linking" note (#5) is a special case of.

## 5. Screens

### Screen 0 — Home
Two buttons: **Fetch** → Screen 1, **History** → Screen 2. No other logic.

### Screen 1 — Random List
- Fetches 10 people from randomuser.me **exactly once per session**, the first time Screen 1 is entered via Home's Fetch button. No in-screen refresh action, and no re-fetch on subsequent visits (including leaving via Home and clicking Fetch again) — `randomUsersStore` keeps returning the same cached batch for the whole session, consistent with #4. **[Decision]**
- Row shows: thumbnail, name (title+first+last), gender, country, phone, email.
- **Filter:** two separate inputs, name (text) and country (derived dropdown/select from the fetched set's distinct countries). 
Client-side, instant (no debounce), there's no network call to throttle; debounce only makes sense to reduce network chatter, which doesn't apply to filtering 10 already-fetched records in memory. **[Decision]**
- **Filter semantics:** name = case-insensitive substring match against the concatenated "first last"; country = exact match (it's a dropdown, not free text). When both are set, they combine with AND (a row must satisfy both to show).
- Each filter has its own clear button, shown only once that filter is set: name's clears the text, country's resets the dropdown to "All countries."
- Clicking a row → Screen 3, resolved from `randomUsersStore`.
- Rows already saved in this session show a visual "saved" indicator (from `isSaved` flag) — see #7.
- **Back** button → Screen 0 (§4).

### Screen 2 — Saved Profiles
Identical UI/UX to Screen 1 (same row layout, same two-input client-side filter), but the list comes from the backend (`savedUsersStore`, fetched fresh on entry). No server-side filtering — the saved set is small and "identical" reads as UX parity, not implementation parity. **[Decision]**
- **Back** button → Screen 0 (§4).

### Screen 3 — Profile Detail
Reached from Screen 1 or Screen 2. Shows:
- Large image, gender, editable name field, age + year of birth (derived from `dob`), address (street number + name, city, state), contact (email, phone).
- **Scope of "editable":** only the name field is editable. Gender, age/YOB, address, and contact are read-only display — the BiDi requirement's mention of email/phone/street-number needing to stay LTR is about *display direction*, not editability. **[Decision]**
- **Title is not shown on Screen 3.** The brief's Screen-3 field list (Gender, Editable Name field, Age+YOB, Address, Contact) doesn't include Title, unlike Screen 1/2's row which explicitly shows "title + first + last." The editable name field is First+Last only; `title` is preserved unchanged in the underlying object (still shown on Screen 1/2's row) but not surfaced or editable here. **[Decision]**
- **Buttons**, conditional on origin:
  - **Save** — visible only if origin is Screen 1 AND not already flagged saved this session. Persists via `POST /api/users`, using whatever is currently typed in the name field (not just the last value committed via Update) — otherwise an in-progress name edit would be silently discarded on Save, with no error or warning, which is worse than requiring Update-first. **[Decision]** On success: flip local `isSaved` flag on the `randomUsersStore` item and mirror the typed name into it too, so Screen 1's row reflects what was actually persisted (does **not** mirror into `savedUsersStore` — see #7). Button becomes unavailable after success.
  - **Delete** — visible only if origin is Screen 2 (already in DB). Calls `DELETE /api/users/:uuid`, removes from `savedUsersStore`, navigates back.
  - **Update** — name field is editable inline (not a separate mode).
    - If saved (Screen 2 origin): `PATCH /api/users/:uuid` on submit.
    - If not saved (Screen 1 origin): mutates the `randomUsersStore` item in place, no network call.
  - **Back** — returns to the originating screen without side effects beyond whatever Save/Update/Delete already did.

**No deep-linking:** Screen 3 is not directly navigable via URL refresh — the profile object is read from an in-memory store, not re-fetched by id (see #4's general reload-behavior rule). Documented cut corner (#9). **[Decision]**

## 6. BiDi (RTL/LTR) requirement

Page-level `dir="rtl"` alone is insufficient, it also reorders flex/grid children, not just text direction. Approach: **[Decision]**

- Static field **labels** (Gender, Name, Address, City, State, Email, Phone, etc.) are hardcoded Hebrew strings, and the form's overall layout is RTL.
- **Data fields that must stay LTR** — email, phone, street number — get explicit `dir="ltr"` **and** `text-align: left` on the field itself, plus `direction: ltr` on their wrapping row where needed, so the label/input pairing doesn't visually reverse due to the parent's RTL flex flow.
- **The editable name field is the exception:** randomuser.me can return non-Latin names (e.g. Arabic-locale data), so it isn't safe to force `dir="ltr"` on it. Its inputs use `dir="auto"` instead, letting the browser infer direction from the actual content (existing value or what's typed), while still sitting in an LTR-ordered `First`/`Last` row so the two inputs don't swap position.
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

**Validation:** `POST`/`PATCH` bodies are checked for the required shape (uuid present, name non-empty) and rejected with `400` on failure — matching the brief's "thin but proper" bar even at 3-4 endpoints, not full schema validation.

## 9. Deliberately cut corners (to restate in DECISIONS.md, ≤1 page)

- No deep-linking / no Screen-3 detail endpoint.
- No client-side mirroring of saved-state beyond the local session flag (#7) — accepted stale-button edge case within a session, resolved by backend upsert idempotency.
- No TanStack Query — plain `fetch` + Pinia actions. Would adopt TanStack Query in production for its optimistic-update primitives (`onMutate`/`onError` rollback).
- No ORM (Prisma) — raw SQL via `better-sqlite3` behind a thin repository layer; would move to Postgres + an ORM at real scale.
- No server-side filtering on Screen 2.
- No "unsaved changes" confirmation when navigating Back from Screen 3 (#4).
- No Delete confirmation dialog,immediate delete on click. In production: a confirm step (dialog or undo-toast) before an irreversible destructive action.
- No deployment, brief lists it as a plus, not a requirement; not pursued given the time budget.

## 10. Extension (~30 min budget)

**Chosen: automated test(s) over optimistic UI.** **[Decision]**
Optimistic updates require rollback-on-failure and user-visible error handling to be done honestly.
a half-implemented version (update, no rollback) is worse than none, and risks not finishing cleanly in 30 minutes.
**Target:** a focused test on the store's save/update/delete provenance logic (#3, #7),
the most bug-prone conditional code in the app (Vitest, frontend). Backend upsert/idempotency behavior (#7, #8) is a secondary candidate if time remains.
"What I'd build next": TanStack Query's optimistic-update primitives, applied to the Save/Delete actions specifically.

## 11. Out of scope (explicitly, per brief)

No authentication, no RBAC, no full REST maturity (pagination, HATEOAS, etc.) — 3-4 endpoints with clean resource modeling is sufficient per the brief.

## 12. Loading & error states

Not an extension, a minimum bar expected of "proper" software design, since the evaluation criteria explicitly name error handling under code quality:

- **Screen 1 initial fetch:** loading indicator while in flight; on failure, an inline error message with a retry action (don't leave a blank screen).
- **Screen 2 fetch:** same pattern; additionally, an explicit empty state ("no saved profiles yet") when the list is empty but the fetch succeeded — distinct from an error state.
- **Screen 3 actions (Save/Update/Delete):** the triggering button shows a busy state and is disabled for the duration of its request (prevents double-submit, independent of the upsert idempotency in §7). On failure, an inline, non-blocking error message; the user stays on Screen 3 and can retry — no silent failures, no forced navigation away.

## 13. Cross-cutting technical requirements (for the tech spec to account for)

- **CORS avoided via Vite dev proxy, not backend middleware:** `client/vite.config.ts` proxies `/api/*` to the backend's local URL, so the browser only ever talks to the Vite origin — no cross-origin request happens in dev, so no CORS configuration is needed on the backend for this submission. **[Decision]**
**Tradeoff:** this is dev-server-only (works under `vite dev`, and `vite preview` if its proxy is configured too) — a real deployment with client and server on separate hosts would need actual CORS headers or a shared reverse proxy in front of both. Acceptable here since deployment itself is out of scope (§9).
- **Frontend calls use relative paths** (`/api/users`, etc.) rather than an absolute API base URL — no `API_BASE_URL` env var needed on the client. The one thing to keep in sync is the backend's port, referenced by the proxy's target in `vite.config.ts`; document it in both READMEs.
- **Env vars to document** (in the relevant per-folder README, per §1): backend listening port (the only one either side truly needs).
