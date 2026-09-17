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

Save also reads whatever is currently typed in the name field, not just the last value
committed via Update — the alternative (Save only persisting the last Updated name) would
silently discard an in-progress edit with no error or warning, which is worse than
requiring Update-first.

## 2. BiDi approach: labels follow RTL, identifying data stays LTR

Page-level `dir="rtl"` alone reorders flex/grid children, not just text — insufficient on
its own. Static field **labels** (Gender, Name, Address, etc.) render in Hebrew and follow
the RTL flow; **data** fields that must stay LTR (email, phone, street number) get both
`dir="ltr"` and explicit `text-align: left`, with `direction: ltr` on the wrapping row
where needed so the label/input pair doesn't visually reverse. Buttons (Save/Delete/Update/
Back) stay in English with natural left-to-right order — a deliberate exception, since
they're actions, not RTL prose.

The editable name field is the one exception to "force LTR": randomuser.me can return
non-Latin names (e.g. Arabic-locale data), so forcing `dir="ltr"` on it would mis-render a
non-Latin value. It uses `dir="auto"` instead, letting the browser infer direction from
the actual content, while still sitting in an LTR-ordered First/Last row so the two inputs
don't swap position.

## 3. UI library: shadcn-vue over hand-rolled markup or a heavier component library

shadcn-vue components are copied into the repo (not an opaque npm dependency), so every
primitive is plain, editable Vue + Tailwind — full control to adapt for the BiDi layout
(Decision 2) without fighting a library's own styling API. It also builds on Radix/Reka,
so accessible behavior (focus handling, keyboard nav, ARIA attributes on `Select`, etc.)
comes for free instead of being hand-rolled per input. Tailwind was already the styling
choice, so it's zero extra runtime cost, unlike pulling in a full component library
(Vuetify, PrimeVue) for a 4-screen app.

Primitives (`Button`, `Input`, `Select`, `Card`, `Label`, `Alert`, `Sonner`) are used
wherever one fits; custom markup is limited to layout no primitive covers, e.g. the
profile row and the label/value row structure on Screen 3.

---

## Extension

Brief calls for one extension beyond the core scope; **chosen: a targeted test over
optimistic-update UI.**

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
