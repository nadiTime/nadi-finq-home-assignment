# server

Express + TypeScript + better-sqlite3 backend for the finQ home assignment.

## Prerequisites

- Node.js 22+
- npm

## Install

```sh
npm install
```

## Run (dev)

```sh
npm run dev
```

Starts the server with `tsx watch`, restarting on file changes.

## Build & run (production)

```sh
npm run build
npm start
```

## Environment variables

| Name   | Default | Description                          |
|--------|---------|---------------------------------------|
| `PORT` | `3000`  | Port the HTTP server listens on. Also set as the proxy target in `client/vite.config.ts` — keep both in sync. |

## Data

SQLite database file is created on boot at `server/data.sqlite` (gitignored).
