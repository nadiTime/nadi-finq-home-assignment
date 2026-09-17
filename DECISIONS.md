# DECISIONS.md (draft — will trim to ≤1 page before submission)

## 1. Provenance model: origin-screen + local flag, not a server round-trip
Screen 3's Save/Delete visibility is derived from *which store the profile object came from* (random vs saved), not a runtime "is this saved?" API call. `login.uuid` from randomuser.me is the canonical key end-to-end (also the DB primary key), so a saved profile and its random-fetch counterpart are trivially the same identity.
After a successful Save, we flip a **local-only** `isSaved` flag on that item inside the `randomUsersStore` (to stop a re-click from re-triggering Save in the same session) — but we deliberately do **not** mirror that into the `savedUsersStore`. Mirroring would create a second, client-side "source of truth" that can silently drift from the backend. Screen 2 stays the one place that reflects real persisted state.
**Tradeoff accepted:** if a user saves a profile and clicks the same row again in the same session, our local flag prevents duplicate UI-triggered saves — but this is UI-level protection, not correctness protection. Backend `POST /api/users` is an upsert on `uuid` conflict as defense-in-depth, not because the UI is expected to reach it.

**Explicit call not covered by the brief:** after saving, the item stays visible in Screen 1's list (flagged as saved) rather than being removed. The random batch represents "what was fetched," and saving is a copy-to-backend action, not a move — removing it would make Screen 1 behave like a queue being drained, which isn't implied anywhere in the spec, and would cause visible list reflow with no stated reason. Flag-in-place keeps the two stores honestly independent: Screen 1 always shows what was fetched, Screen 2 always shows what's persisted.

## 2. State management: Pinia, two stores, not one
`randomUsersStore` (ephemeral, client-mutable) and `savedUsersStore` (mirrors backend, server is truth) are kept separate rather than one unified "users" store. They have different consistency semantics: one only exists in memory and can be freely mutated by an Update on Screen 3; the other must reflect the backend or Screen 2 lies to the user. Local component state was ruled out early — an edit made on Screen 3 to an unsaved profile must be visible back on Screen 1's list, which requires state to outlive the Screen-3 component.

## 3. Backend: SQLite via `better-sqlite3`, no ORM
SQLite over JSON-file for real schema/typing with near-zero setup cost; no Prisma because a schema/generate/client layer is disproportionate overhead for one table and 4 endpoints. Raw SQL through a thin repository layer instead.
**Production tradeoff:** single-file SQLite doesn't handle concurrent writers or multi-instance deploys — would move to Postgres (still behind the same repository interface) if this needed to scale.

## 4. Filter: two inputs, client-side, no debounce
Name + country as separate inputs, filtered instantly against the 10 already-fetched records (Screen 1) or the already-fetched saved set (Screen 2) — a pure in-memory `.filter()`, zero I/O. Debounce solves network-latency/cost problems; there's no network call being throttled here, so adding one would be cargo-culting a pattern for a problem this design doesn't have.

## 5. BiDi approach
Page-level `dir="rtl"` is not enough by itself: it also reorders flex/grid children, not just text. Static field **labels** (Gender, Name, Address, etc.) render in Hebrew and follow the RTL flow; interactive **data** fields that must stay LTR (email, phone, street number, the editable Latin name) get both `dir="ltr"` and explicit `text-align: left`, and their wrapping row uses `direction: ltr` where needed so the label/input pair doesn't visually reverse. Buttons (Save/Delete/Update/Back) stay in English with natural left-to-right order — a deliberate exception, not an oversight, since they're actions, not RTL prose.

## 6. UI: shadcn-vue (Tailwind + Radix/Reka primitives), not a full component library
Copy-paste ownership over every component (vs. Vuetify/PrimeVue as an opaque dependency) means BiDi handling in Section 5 isn't fighting a library's own RTL assumptions — we own the source. Accepted ~15-20 min upfront setup cost (Tailwind config, CLI init) as worthwhile for the design-taste signal given "no UI design provided."

## 7. CORS: Vite dev proxy instead of backend middleware
`client/vite.config.ts` proxies `/api/*` to the backend, so the browser only ever talks to the Vite origin in dev — no CORS headers on the backend at all, and no risk of a hastily-permissive `cors()` config (an easy smell in a fintech review).
**Tradeoff:** dev-server-only — a real deployment with client/server on separate hosts would need actual CORS headers or a shared reverse proxy. Acceptable since deployment is out of scope here (see Corners cut).

## 7a. Data normalization: drop randomuser.me records without a `uuid`
`login.uuid` is the canonical identity key end-to-end (Decision 1) — a record missing it
can't be saved, can't be the target of Update/Delete, and can't be matched against
`savedUsersStore`. Rather than defend against a missing uuid at every call site, a single
`normalizeProfile()` step runs right after the randomuser.me fetch and silently drops any
record without one; every other field is defaulted rather than treated as fatal, since only
`uuid` is load-bearing for identity. This keeps `randomUsersStore` invariant (every item has
a valid uuid) so no downstream code needs a null-check for it.
**Tradeoff accepted:** if randomuser.me ever returns a malformed record, the batch silently
shows fewer than 10 rows with no user-facing notice. Acceptable given how rare and out of the
user's control this is; a production version might surface a toast ("N profiles skipped").

## 8. Corners cut (deliberate)
- No `GET /api/users/:uuid` / no deep-linking to Screen 3 — the full profile object is passed via store lookup on navigation, not re-fetched by id. A refresh on Screen 3 loses state. In production: add a detail endpoint + route guard.
- No client-side mirroring of "saved" status onto random-list items beyond the local `isSaved` flag (see Decision 1) — accepted stale-button edge case within a session.
- No TanStack Query — plain `fetch` + Pinia actions instead. TanStack Query's optimistic-update primitives (`onMutate`/`onError` rollback) would meaningfully reduce boilerplate in production, but adopting it for two GETs/a POST/a PATCH/a DELETE isn't justified at this scale.

## 9. Extension: tests over optimistic updates
Chose a focused test over optimistic-update UI. Optimistic updates need rollback-on-failure and user-visible error handling to be honest about failure states — hard to finish correctly in the ~30min budget, and a half-implemented version (update, no rollback) is worse than none. Target: [TBD — store's save/update/delete provenance logic, the most bug-prone conditional code in the app]. *(Will fill in "what I'd build next" after the extension is implemented.)*

---
*Draft note: this file will be trimmed to the 3 most interesting decisions (max 1 page) before final submission, per the assignment's own instruction — right now it captures everything settled during the design/grill pass so nothing gets lost.*
