# Decisions

Three decisions worth explaining, out of everything settled while building this.

## 1. Provenance model: origin-screen + local flag, not a server round-trip

Screen 3's Save/Delete visibility is derived from *which store the profile object came
from* (random vs. saved), not a runtime "is this saved?" API call. `login.uuid` from
randomuser.me is the canonical identity key end-to-end (also the DB primary key), so a
saved profile and its random-fetch counterpart are trivially the same identity.

After a successful Save, we flip a **local-only** `isSaved` flag on that item inside
`randomUsersStore` — to stop a re-click from re-triggering Save in the same session —
but deliberately don't mirror that into `savedUsersStore`. Mirroring would create a
second, client-side "source of truth" that can silently drift from the backend; Screen 2
stays the one place that reflects real persisted state. Backend `POST /api/users` upserts
on `uuid` conflict as defense-in-depth, not because the UI is expected to rely on it.

This same uuid-centrality is why `normalizeProfile()` drops any randomuser.me record
missing `login.uuid` right after fetch, rather than null-checking for it at every call
site downstream: a record without an identity can't be saved, updated, deleted, or
matched against `savedUsersStore`, so it's not usable regardless. Every other field gets
a default instead — only `uuid` is load-bearing.

## 2. BiDi approach: labels follow RTL, identifying data stays LTR

Page-level `dir="rtl"` alone reorders flex/grid children, not just text — insufficient on
its own. Static field **labels** (Gender, Name, Address, etc.) render in Hebrew and follow
the RTL flow; **data** fields that must stay LTR (email, phone, street number, the
editable Latin name) get both `dir="ltr"` and explicit `text-align: left`, with
`direction: ltr` on the wrapping row where needed so the label/input pair doesn't visually
reverse. Buttons (Save/Delete/Update/Back) stay in English with natural left-to-right
order — a deliberate exception, since they're actions, not RTL prose.

## 3. Extension: a targeted test over optimistic-update UI

Optimistic updates need rollback-on-failure and honest user-visible error handling to be
worth doing — hard to finish correctly in the time budget, and a half-implemented version
(update-then-hope, no rollback) is worse than none. Chose instead to cover the store's
save/update/delete provenance logic (Decision 1) with `randomUsersStore.store.spec.ts` —
the most bug-prone conditional code in the app — plus a secondary test on
`normalizeProfile`'s uuid-drop rule.

---

Other corners knowingly cut: no `GET /api/users/:uuid` (Screen 3 resolves from the
in-memory store, not a re-fetch by id — a reload loses that state, by design, see
`PRODUCT_SPEC.md` #4); no TanStack Query (plain `fetch` + Pinia actions are proportionate
at two GETs/a POST/a PATCH/a DELETE); no deployment.
