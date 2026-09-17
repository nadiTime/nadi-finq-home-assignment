# Implementation Plan

Each numbered step is sized to land as one git commit, in order. Commit message shown
in `code font` after each step — use as-is or adapt. Steps within a phase are sequential;
phases are mostly sequential too (backend before frontend stores that call it), except
Phase A (scaffolding) which can be split further if useful.

## Phase A — Repo scaffolding

1. Root `package.json` (optional, just for repo metadata) not required — skip if root has
   no scripts to run. Create `server/package.json`, `tsconfig.json`, install
   `typescript`, `express`, `better-sqlite3`, `@types/express`, `@types/better-sqlite3`,
   `tsx`, `vitest`.
   `chore(server): scaffold TypeScript + express + better-sqlite3`
2. Create `client/` via `npm create vite@latest . -- --template vue-ts`, then add
   Tailwind, Pinia, Vue Router. Don't init shadcn-vue yet (needs Tailwind first).
   `chore(client): scaffold Vite + Vue 3 + TS + Pinia + Vue Router`
3. Init Tailwind config + shadcn-vue CLI (`npx shadcn-vue@latest init`), add the handful
   of primitives needed (button, input, select, card).
   `chore(client): add Tailwind + shadcn-vue`

## Phase B — Backend

4. `db/schema.sql` + `db/connection.ts` (opens/creates the sqlite file, runs schema on boot).
   `feat(server): add sqlite schema and connection`
5. `db/users.repository.ts` — `listUsers`, `upsertUser`, `updateUserName`, `deleteUser`.
   `feat(server): add users repository (list/upsert/update/delete)`
6. `validation/users.schema.ts` — shape checks for POST/PATCH bodies.
   `feat(server): add request body validation for users routes`
7. `routes/users.routes.ts` + `app.ts` wiring — all four endpoints from tech spec §6.
   `feat(server): add GET/POST/PATCH/DELETE /api/users routes`
8. `index.ts` — reads `PORT` env var, starts the server.
   `feat(server): add entrypoint reading PORT from env`
9. `server/README.md` — prerequisites, Node version, install/run, `PORT` env var.
   `docs(server): add README`

## Phase C — Frontend data layer

10. `types/profile.ts` — canonical `Profile` interface (tech spec §3).
    `feat(client): add Profile type`
11. `lib/normalizeProfile.ts` — maps raw randomuser.me person → `Profile`, returns `null`
    when `login.uuid` is missing (tech spec §4). This is the normalization step.
    `feat(client): add normalizeProfile, dropping records without a uuid`
12. `api/randomUsers.ts` (fetch from randomuser.me) and `api/savedUsers.ts` (fetch/post/
    patch/delete against `/api/users`).
    `feat(client): add API clients for randomuser.me and backend`
13. `stores/randomUsers.store.ts` — `fetchOnce`, `markSaved`, `updateLocalName`, wired
    through `normalizeProfile`.
    `feat(client): add randomUsersStore with fetch-once + normalization`
14. `stores/savedUsers.store.ts` — `fetchAll`, `save`, `updateName`, `remove`.
    `feat(client): add savedUsersStore`
15. `composables/useProfileFilters.ts` — generic (no router dependency), so it can land as
    soon as `Profile` exists.
    `feat(client): add useProfileFilters composable`
16. `vite.config.ts` — `/api` dev proxy to backend `PORT`.
    `chore(client): proxy /api to backend in dev`

## Phase D — Routing & shell

17. `router/index.ts` — routes for Screen 0-3 (Screen 3 route carries `uuid` + source store).
    `feat(client): add router with Screen 0-3 routes`
18. `composables/useProfileSource.ts` — resolves Screen 3's `Profile` from the route's
    `uuid` + source store, now that both the router and both stores exist.
    `feat(client): add useProfileSource composable`

## Phase E — Screens

19. `views/HomeView.vue` — Screen 0, Fetch/History buttons (shadcn `Button`).
    `feat(client): add Home screen`
20. `components/ProfileRow.vue`, `components/ProfileFilters.vue`, `components/ProfileList.vue`
    — shared row/filter/list, built for Screen 1 & 2 reuse (product spec §5 Screen 2 is
    UI-identical to Screen 1); `ProfileFilters`/`ProfileList` consume `useProfileFilters`
    rather than re-deriving the filter logic per screen. Use shadcn `Input`/`Select`/`Card`
    primitives per tech spec §1.
    `feat(client): add shared profile row/filter/list components`
21. `views/RandomListView.vue` — Screen 1, wires `randomUsersStore.fetchOnce`, filters,
    loading/error states, saved indicator, Back button (product spec §4) → Screen 0.
    `feat(client): add Random List screen`
22. `views/SavedListView.vue` — Screen 2, wires `savedUsersStore.fetchAll` on entry,
    loading/error/empty states, Back button → Screen 0.
    `feat(client): add Saved Profiles screen`
23. `views/ProfileDetailView.vue` — Screen 3: resolves via `useProfileSource`, display
    fields, editable name, BiDi layout (Hebrew labels + RTL, LTR-pinned data fields per
    tech spec/product spec §6), conditional Save/Update/Delete/Back buttons, each with its
    own local pending/error ref (no shared composable — see tech spec §5a).
    `feat(client): add Profile Detail screen with BiDi layout and Save/Update/Delete`

## Phase F — Polish pass

24. Manual QA pass against product spec §5-§7 edge cases (saved flag persists across
    filter/nav, full reload resets to Screen 0, Screen 3 discards unsaved name edit on
    Back). Fix anything found.
    `fix(client): address issues found in manual QA pass`

## Phase G — Extension (tests)

25. `stores/randomUsers.store.spec.ts` — provenance logic: `markSaved` doesn't touch
    `savedUsersStore`, `updateLocalName` mutates in place, second `fetchOnce()` doesn't re-fetch.
    `test(client): cover randomUsersStore save/update provenance logic`
26. *(if time remains)* pick one: `lib/normalizeProfile.spec.ts` (drops uuid-less records,
    defaults minor missing fields) or `composables/useProfileFilters.spec.ts` (AND semantics,
    case-insensitivity) — both are pure logic and equally good secondary targets.
    `test(client): cover normalizeProfile uuid-drop rule`

## Phase H — Docs

27. Root `README.md` — project overview, how to run both sides together.
    `docs: add root README`
28. `AI_USAGE.md` — which AI tools were used and for what.
    `docs: add AI_USAGE.md`
29. Trim `DECISIONS.md` to the final ≤1 page (per its own draft note) — keep the 3 most
    interesting decisions, fold the normalization tradeoff in briefly.
    `docs: trim DECISIONS.md to final page`

---

Steps 25-26 (extension) can move earlier if time pressure makes it safer to bank the test
before further screen polish — the store logic they cover exists after step 14, so the
test could land right after Phase C if preferred.

## Phase I — Post-review polish (design/UX feedback pass)

Findings from a manual pass over the running app after Phase F. #1 (force-refetch on Home's
Fetch button) was raised and dropped — PRODUCT_SPEC §4/§5 already deliberately reject an
in-screen refetch, and re-litigating it isn't warranted.

30. Button variant fixes: Screen 3's `Update` button reads as disabled next to `Save`/`Delete`
    (wrong shadcn variant); its `Back` button doesn't match Screen 1/2's `Back` styling.
    `fix(client): correct Update/Back button variants on Profile Detail`
31. Busy-state labels: Save/Update/Delete already disable while their request is in flight
    (PRODUCT_SPEC §12) but the button text never changes, so a slow request looks like a
    no-op click. Swap label to "Saving…"/"Updating…"/"Deleting…" while pending.
    `feat(client): show busy label on Save/Update/Delete while pending`
32. Fix stale `isSaved` flag after delete: deleting a profile from Screen 2 doesn't clear the
    matching item's local `isSaved` flag in `randomUsersStore` (PRODUCT_SPEC §7/§9 flagged this
    as an accepted cut corner, but it's worth the couple of lines now that it's visibly wrong).
    `fix(client): clear isSaved on randomUsersStore when a profile is deleted`
33. Add shadcn-vue `sonner` (toast) + `alert` primitives (`npx shadcn-vue@latest add sonner
    alert`), mount `<Toaster />` in `App.vue`. Use toast for transient Screen 3 action failures
    (Save/Update/Delete); use the `Alert` component (instead of plain red text) for Screen 1/2
    fetch-failure states, keeping the inline retry action required by PRODUCT_SPEC §12.
    `feat(client): replace raw error text with toast/alert components`
34. Screen 3 layout: put each field's label and value on the same row (still RTL-flowing,
    still LTR-pinned for email/phone/street-number/name per §6) instead of stacked.
    `style(client): put Profile Detail labels and values on the same row`
35. Name input direction: switch the editable name inputs from forced `dir="ltr"` to
    `dir="auto"` so the browser infers direction per actual typed/existing content (needed
    since randomuser.me can return non-Latin names, e.g. Arabic). Update PRODUCT_SPEC §6's
    wording, which incorrectly assumed the name field is always Latin script.
    `fix(client): use dir=auto on name inputs to support non-Latin names`
