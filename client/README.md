# client

Vue 3 + TypeScript + Vite frontend for the finQ home assignment.

## Prerequisites

- Node.js 22+
- npm
- The backend (`../server`) running — see `server/README.md`. API requests to `/api` are
  proxied to it in dev (see `vite.config.ts`).

## Install

```sh
npm install
```

## Run (dev)

```sh
npm run dev
```

Starts the Vite dev server (default: http://localhost:5173) with hot module reload.
Requests to `/api/*` are proxied to `http://localhost:3000` — make sure the server is
running first.

## Build & preview (production)

```sh
npm run build
npm run preview
```

`build` type-checks with `vue-tsc` and bundles with Vite into `dist/`. `preview` serves
that bundle locally. In production, `/api` is not proxied automatically — serve the
client behind the same origin/reverse proxy as the backend, or adjust API calls
accordingly.

## Tests

```sh
npm run test
```

Runs the Vitest unit tests (`vitest run`).

## Environment variables

None. The client has no build-time or runtime env vars of its own — it talks to the
backend exclusively via the `/api` path, proxied in dev by `vite.config.ts` and expected
to sit behind the same origin in production.
