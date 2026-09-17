# Tech Spec — finQ Home Assignment (Random User Profiles)

Implements `PRODUCT_SPEC.md`. This document is the "how": concrete types, modules, files,
and contracts. Section numbers below cross-reference the product spec section they implement.

## 1. Stack & tooling

- **Backend:** Node + TypeScript, Express (thin routing only), `better-sqlite3`, `zod` for request-body validation, `tsx` for dev, Vitest for tests.
- **Frontend:** Vue 3 (Composition API, `<script setup>`), TypeScript, Vite, Vue Router, Pinia, Tailwind + shadcn-vue, Vitest for unit tests.
- **Package manager:** npm, one `package.json` per folder (no workspaces) — `client/` and `server/` are independently installable per product spec #1.
- **UI components:** prefer shadcn-vue primitives over hand-rolled markup wherever one fits
  (button, input, select, card, label, etc.) — add via `npx shadcn-vue@latest add <name>` as
  needed rather than writing a plain `<button>`/`<input>` first and refactoring later. Custom
  markup only where no shadcn-vue primitive covers the need (e.g. the row layout itself).

## 2. Repo layout

```
server/
  src/
    db/
      schema.sql
      connection.ts
      users.repository.ts     # thin SQL layer over the users table
    routes/
      users.routes.ts
    validation/
      users.schema.ts          # shape checks for POST/PATCH bodies
    app.ts                     # express app, no listen()
    index.ts                   # listen(), reads PORT env var
  README.md
  package.json

client/
  src/
    types/
      profile.ts               # canonical Profile interface
    lib/
      normalizeProfile.ts       # randomuser.me raw -> Profile, drops bad records
    api/
      randomUsers.ts            # fetch from randomuser.me
      savedUsers.ts              # fetch from backend /api/users
    stores/
      randomUsers.store.ts
      savedUsers.store.ts
    composables/
      useProfileFilters.ts       # name+country filter state, shared by Screen 1 & 2
      useProfileSource.ts        # resolves Screen 3's Profile from route uuid+source
    router/
      index.ts
    components/
      ProfileRow.vue
      ProfileFilters.vue
      ProfileList.vue           # shared by Screen 1 & 2
    views/
      HomeView.vue              # Screen 0
      RandomListView.vue        # Screen 1
      SavedListView.vue         # Screen 2
      ProfileDetailView.vue     # Screen 3
    App.vue
    main.ts
  vite.config.ts                # /api proxy (product spec #13)
  README.md
  package.json

README.md            # root: overview + how to run both sides
DECISIONS.md
AI_USAGE.md
```

## 3. Canonical `Profile` type (client)

One flattened shape used across both stores and all screens (product spec #2):

```ts
export interface Profile {
  uuid: string
  picture: { thumbnail: string; large: string }
  name: { title: string; first: string; last: string }
  gender: string
  location: {
    country: string
    city: string
    state: string
    streetNumber: number
    streetName: string
  }
  email: string
  phone: string
  dob: { age: number; year: number }
  isSaved?: boolean   // randomUsersStore-only, absent on savedUsersStore items
}
```

The backend stores the same shape, JSON-serialized per-column or as a single JSON blob
keyed by `uuid` (see #6) — the wire format for `GET/POST/PATCH /api/users` is this same
`Profile` shape (minus `isSaved`, which is a client-only concept).

## 4. Data normalization (new: defensive layer over randomuser.me)

`randomuser.me` is an uncontrolled external API. Screen 1's fetch-once batch (product spec #5)
must not let a malformed record corrupt `randomUsersStore` or crash the UI. This is a new
requirement not explicit in the product spec, added here because `login.uuid` is the
canonical identity key end-to-end (product spec #2) — a record without it can't be saved,
can't be the target of Update/Delete, and can't be matched against `savedUsersStore` state.

**Rule:** after fetching `https://randomuser.me/api/?results=10`, each raw `results[]` item is
passed through `normalizeProfile(raw): Profile | null`:

- If `raw.login?.uuid` is missing/empty → return `null`. The item is **dropped from the list
  entirely** — not rendered, not counted, not retried. It is simply not used.
- Otherwise, map the raw person object into the flattened `Profile` shape above.

The store's fetch action does:

```ts
const raw = await fetchRandomUsers() // results[] from randomuser.me
const profiles = raw.map(normalizeProfile).filter((p): p is Profile => p !== null)
```

This keeps `randomUsersStore` invariant: every item in it always has a valid `uuid`. No
other code path needs to re-check for a missing uuid.

**Scope:** only `uuid` presence gates inclusion. Other fields (e.g. a missing `location.state`)
are not a reason to drop a record — they're defaulted to `''`/`0` by the mapping so a single
odd field doesn't discard an otherwise-usable profile. This mirrors the user's ask ("mostly
the uuid... if we have one without we can just remove it from the list").

**Testability:** `normalizeProfile` is a pure function (raw JSON in, `Profile | null` out) —
no store/network dependency — so it's directly unit-testable. This is also the natural home
for the extension's second test target if time remains after the store provenance test
(product spec #10).

## 5. Frontend stores

### `randomUsersStore` (product spec #3, #5, #7)
- State: `profiles: Profile[]`, `status: 'idle' | 'loading' | 'error'`, `error: string | null`, `fetchedOnce: boolean`.
- `fetchOnce()`: no-op if `fetchedOnce`; else calls `fetchRandomUsers()`, runs through `normalizeProfile`, sets `profiles`, sets `fetchedOnce = true`.
- `markSaved(uuid)`: sets `isSaved = true` on the matching item. Called after a successful `POST`.
- `updateLocalName(uuid, name)`: mutates the item in place (Update on an unsaved profile, product spec #5 Screen 3).
- Never mutates `savedUsersStore` — kept fully independent (product spec #3, DECISIONS.md #1).

### `savedUsersStore` (product spec #3)
- State: `profiles: Profile[]`, `status`, `error`.
- `fetchAll()`: always re-fetches from `GET /api/users` (called on every Screen 2 entry — no "fetch once" rule here, unlike random).
- `save(profile)`: `POST /api/users`, on success pushes/updates local copy (used only if Screen 3 is reached via Screen 2 in some flow — in practice Save only fires from Screen 1 origin per product spec #5, but the store method exists for completeness/testability).
- `updateName(uuid, name)`: `PATCH /api/users/:uuid`, updates local item on success.
- `remove(uuid)`: `DELETE /api/users/:uuid`, removes local item on success.

## 5a. Composables (reusable view logic)

Pinia stores own state + data-fetching actions; composables sit between stores and views
for logic that's reused across screens but isn't itself shared state — Vue's own convention
of separating shared *state* (stores) from shared *stateful logic* (composables). Missing
this layer would mean re-deriving the same filter/lookup logic per view.

- **`useProfileFilters(profiles: Ref<Profile[]>)`** — owns local `name`/`country` filter refs
  and returns a computed filtered list plus the distinct-countries list for the dropdown.
  Implements the exact semantics from product spec #5 (case-insensitive substring on
  "first last", exact match on country, AND when both set) in one place, consumed
  identically by Screen 1 and Screen 2 — which product spec #5 requires to be UI-identical.
- **`useProfileSource(route)`** — reads Screen 3's route params (`uuid` + which store to
  resolve from) and returns the matching `Profile` from `randomUsersStore` or
  `savedUsersStore`, per product spec #3. Centralizes the store-selection branch so
  `ProfileDetailView.vue` doesn't inline it, and so the lookup is unit-testable on its own.

Both are plain composables (no Pinia) — their state is local to whichever view calls them.

**Not a composable:** the Save/Update/Delete busy/error behavior (#8 below) is just three
local `ref(false)`/`ref<string|null>` pairs inside `ProfileDetailView.vue`. A generic
`useAsyncAction()` wrapper was considered, but with only three call sites in a single view
the abstraction doesn't pay for itself — inline refs are simpler to read and just as easy
to test via the view.

## 6. Backend

### Schema (`db/schema.sql`)
```sql
CREATE TABLE IF NOT EXISTS users (
  uuid TEXT PRIMARY KEY,
  data TEXT NOT NULL   -- JSON-serialized Profile (minus isSaved)
);
```
Flattened/JSON-serialized per product spec #2 — one JSON blob column keeps the repository
layer trivial (no per-field migrations for a nested `Profile` shape) while `uuid` stays a
real indexed primary key for the four endpoints' lookups.

### Repository (`users.repository.ts`)
- `listUsers(): Profile[]`
- `upsertUser(profile: Profile): void` — `INSERT ... ON CONFLICT(uuid) DO UPDATE` (product spec #7).
- `updateUserName(uuid, name): Profile | null`
- `deleteUser(uuid): boolean`

### Routes (`users.routes.ts`) — product spec #8
| Method | Path | Body | Success | Errors |
|---|---|---|---|---|
| GET | `/api/users` | — | `200 Profile[]` | — |
| POST | `/api/users` | full `Profile` | `201 Profile` | `400` on missing `uuid`/empty name |
| PATCH | `/api/users/:uuid` | `{ name: { first, last } }` | `200 Profile` | `400` invalid body, `404` unknown uuid |
| DELETE | `/api/users/:uuid` | — | `204` | `404` unknown uuid |

### Validation (`validation/users.schema.ts`)
`zod` schemas validate the full request body against the `Profile` shape (POST) or
`{ name: { first, last } }` (PATCH) — a superset of product spec #8's original "uuid
non-empty, name non-empty" bar, adopted because a hand-rolled type guard for every field
of `Profile` couldn't avoid an `as Profile` cast between the parsed body and the repository
type, whereas `z.ZodType<Profile>` cross-checks the schema against `Profile` at compile
time with no cast at all. Returns `{ ok: true, data }` or `{ ok: false, errors: string[] }`
(errors are the zod issues' messages); routes map failure to `400`.

## 7. Cross-cutting (product spec #13)

- `client/vite.config.ts` proxies `/api` → `http://localhost:<PORT>` (dev only).
- Frontend calls relative paths only (`/api/users`), no `API_BASE_URL`.
- Backend `PORT` env var documented in `server/README.md`; the same value goes into the
  proxy target in `client/vite.config.ts` — noted in both READMEs so they can't drift silently.

## 8. Loading & error states (product spec #12)

Both stores expose `status`/`error` so views render one of: loading skeleton/spinner,
inline error + retry button, or (Screen 2 only) an explicit empty state. Screen 3's action
buttons track a local `pending` ref to disable-during-request and show inline error text
on failure, independent of the two stores' own status.

## 9. Testing (product spec #10 extension)

- **Primary:** `randomUsers.store.spec.ts` — covers the provenance logic: `markSaved` flips
  the flag without touching `savedUsersStore`; `updateLocalName` mutates in place; a second
  `fetchOnce()` call after `fetchedOnce = true` does not re-fetch.
- **Secondary (if time remains):** `normalizeProfile.spec.ts` — a record missing `login.uuid`
  is dropped; a record with a valid uuid but a missing minor field (e.g. `location.state`)
  is kept with a defaulted value.
- **Also good candidates, being pure logic:** `useProfileFilters.spec.ts` (AND semantics,
  case-insensitivity) and `useProfileSource.spec.ts` (resolves from the right store) — either
  can substitute for the normalizeProfile test above if it turns out more bug-prone in practice.
- Backend upsert idempotency test is a tertiary candidate, per product spec #10.

## 10. Non-goals

Everything in product spec #9 and #11 (no deep-linking, no server-side filtering, no
optimistic UI, no ORM, no deployment, no auth). Not restated here in detail.
