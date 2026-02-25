# Network Sentinel (GenzeX)

Cybersecurity-themed network monitoring app built with Expo (React Native) + Express backend.

## Tech Stack

- Expo SDK 54 + React Native 0.81
- Expo Router (file-based routing)
- Express 5 (TypeScript)
- TanStack Query
- Drizzle config present (PostgreSQL), currently not used by runtime data

## Features

- Live simulated network connections
- Threat classification: `SAFE`, `SUSPICIOUS`, `MALICIOUS`
- AI model status + mock inference endpoint
- Logs with filtering
- Security settings (monitoring, AI detection, firewall mode)
- Client-side auth (AsyncStorage)
- Subscription/profile flows

## Project Structure

```txt
app/          Expo Router screens
components/   Reusable UI components
contexts/     Auth + Network state providers
lib/          API/query utilities
server/       Express backend and model logic
shared/       Shared TypeScript interfaces
scripts/      Static build pipeline
```

## Prerequisites

- Node.js 20+ (22 recommended)
- npm 10+

## Install

```bash
npm install
```

## Run in Development

Run backend:

```bash
npm run server:dev
```

Run frontend (separate terminal):

```bash
npm run expo:dev
```

Notes:

- `expo:dev` expects `REPLIT_DEV_DOMAIN` style environment in Replit.
- Outside Replit, ensure `EXPO_PUBLIC_DOMAIN` points to your backend host (example: `localhost:5000`).

## Quality Checks

```bash
npm run lint
npx tsc --noEmit
npm run server:build
```

## Production Build

Build static Expo assets:

```bash
npm run expo:static:build
```

Build server bundle:

```bash
npm run server:build
```

Run server bundle:

```bash
npm run server:prod
```

## API Endpoints

- `GET /api/connections`
- `GET /api/stats`
- `GET /api/logs?filter=ALL|SAFE|SUSPICIOUS|MALICIOUS|BLOCKED`
- `POST /api/connections/generate`
- `GET /api/settings`
- `PUT /api/settings`
- `GET /api/model/status`
- `POST /api/model/analyze`

## Current Constraints

- Network data is in-memory (resets on server restart)
- Auth is local-only (device storage), not server-backed
- Drizzle schema is not yet modeled as DB tables
