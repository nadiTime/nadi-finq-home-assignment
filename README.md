# finQ Home Assignment — Random User Profiles

A small full-stack app: fetch random profiles from randomuser.me, browse/filter them,
save selected ones to a backend, and edit or delete saved profiles.

See `PRODUCT_SPEC.md` for the product requirements and `TECH_SPEC.md` for the technical
design (stack, types, module layout, API contract).

## Stack

- **Backend** (`server/`): Node + TypeScript, Express, better-sqlite3.
- **Frontend** (`client/`): Vue 3 + TypeScript, Vite, Pinia, Vue Router, Tailwind + shadcn-vue.

Each side has its own `package.json` and is installed/run independently — there are no
npm workspaces.

## Running both sides

In one terminal:

```sh
cd server
npm install
npm run dev
```

In another terminal:

```sh
cd client
npm install
npm run dev
```

The client dev server proxies `/api` requests to the backend (see `client/vite.config.ts`
and `server/README.md` for the `PORT` env var they must agree on). Open the URL Vite
prints (defaults to `http://localhost:5173`).

## Tests

```sh
cd client && npm test
cd server && npm test
```

## Other docs

- `DECISIONS.md` — key design decisions and tradeoffs.
- `AI_USAGE.md` — which AI tools were used during this assignment and for what.
