# GenzeX

## Overview

GenzeX is a cybersecurity-themed network monitoring mobile application built with Expo (React Native) and an Express.js backend. The app simulates network traffic monitoring with a futuristic/cyberpunk UI aesthetic featuring threat detection, connection logging, and dashboard analytics. It supports iOS, Android, and web platforms.

The app presents users with a dashboard showing real-time network connections classified by threat level (SAFE, SUSPICIOUS, MALICIOUS), traffic logs with filtering, and configurable monitoring settings. It includes user authentication (stored locally via AsyncStorage), subscription tiers (Free/Pro/Enterprise), and profile management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo/React Native)

- **Framework**: Expo SDK 54 with expo-router v6 for file-based routing
- **Navigation**: Tab-based layout with three main tabs (Dashboard, Logs, Settings) plus modal screens for Profile and Subscription
- **State Management**: React Context API for two main domains:
  - `AuthContext` — handles user authentication, registration, profile, and subscription state using AsyncStorage (fully client-side, no server auth)
  - `NetworkContext` — manages network connections, stats, logs, and settings by polling the Express API
- **Data Fetching**: TanStack React Query for API communication, with a custom `apiRequest` helper and `getApiUrl()` that reads from `EXPO_PUBLIC_DOMAIN`
- **UI/Styling**: Dark cyberpunk theme with custom color constants, Rajdhani and Orbitron Google Fonts, animated elements using react-native-reanimated, and Material Community Icons
- **Key Libraries**: expo-haptics for feedback, expo-blur for glass effects, expo-image for optimized images, react-native-gesture-handler, react-native-screens

### Backend (Express.js)

- **Runtime**: Node.js with TypeScript (compiled via tsx for dev, esbuild for production)
- **API**: RESTful JSON API at `/api/*` with these endpoints:
  - `GET /api/connections` — list active connections
  - `GET /api/stats` — dashboard statistics
  - `GET /api/logs?filter=` — filtered traffic logs
  - `POST /api/connections/generate` — create a simulated connection
  - `GET /api/settings` — get monitoring settings
  - `PUT /api/settings` — update monitoring settings
- **Storage**: In-memory `NetworkStorage` class (no database used for connection data). Connections are randomly generated with simulated threat classification based on IP prefix patterns
- **CORS**: Dynamic CORS setup supporting Replit domains and localhost for development
- **Static Serving**: In production, serves static web build; in development, proxies to Metro bundler

### Database Configuration

- **Drizzle ORM** is configured with PostgreSQL (`drizzle.config.ts` points to `DATABASE_URL`), but the shared schema (`shared/schema.ts`) currently only defines TypeScript interfaces — no Drizzle table definitions exist yet
- The database is not actively used; all data is in-memory or AsyncStorage. When adding database features, use the existing Drizzle + PostgreSQL setup with `drizzle-kit push` for migrations

### Authentication

- **Fully client-side**: Users are stored in AsyncStorage under `@genzex_users`, sessions under `@genzex_session`
- Password hashing uses `expo-crypto`
- No server-side authentication exists — this is a design decision for the current prototype stage

### Build & Deployment

- **Development**: Two processes run concurrently — `expo:dev` (Metro bundler) and `server:dev` (Express via tsx)
- **Production**: Static web export via custom `scripts/build.js`, server bundled with esbuild to `server_dist/`
- **Database migrations**: `npm run db:push` using drizzle-kit

### Project Structure

```
app/                    # Expo Router pages (file-based routing)
  (tabs)/               # Tab navigator (Dashboard, Logs, Settings)
  login.tsx             # Login screen
  register.tsx          # Registration screen
  profile.tsx           # Profile modal
  subscription.tsx      # Subscription plans modal
components/             # Reusable UI components
constants/              # Colors and theme constants
contexts/               # React Context providers (Auth, Network)
lib/                    # Utilities (query client, API helpers)
server/                 # Express backend
  index.ts              # Server entry point
  routes.ts             # API route definitions
  storage.ts            # In-memory data storage
shared/                 # Shared types between frontend and backend
  schema.ts             # TypeScript interfaces
```

## External Dependencies

- **PostgreSQL**: Configured via `DATABASE_URL` environment variable for Drizzle ORM (not actively used yet but infrastructure is ready)
- **Expo Services**: Uses Expo's build and development infrastructure
- **Google Fonts**: Rajdhani and Orbitron font families loaded via `@expo-google-fonts`
- **AsyncStorage**: Local device storage for authentication persistence
- **No external APIs**: All network monitoring data is simulated server-side; no third-party security or network APIs are integrated