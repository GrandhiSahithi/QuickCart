# QuickCart

An Uber-Eats/Swiggy-style delivery app demo: browse **Food**, **Grocery**, **Medicine**, and **Shop** verticals, add items to a cart, "pay" with a demo checkout (no real money moves), and watch the order progress live on a map from the store to your door — all simulated server-side, no real couriers or restaurants involved.

## Stack

- Web: React + Vite + React Router + Leaflet (map)
- Mobile: React Native + Expo Router + react-native-maps (Apple Maps on iOS, no API key)
- Backend: Java + Spring Boot + Spring Security (JWT)
- Database: PostgreSQL
- Database ORM: Spring Data JPA / Hibernate

Everything here runs on free tiers: Postgres (local Docker or a free Neon project), Spring Boot self-hosted, Vite/Expo, and OpenStreetMap/Apple Maps (no paid map API keys).

## Project Structure

quickcart/
- web/ — React web app
- mobile/ — React Native (Expo) app
- backend/ — Spring Boot API
- docker-compose.yml — local Postgres

## 1. Database

**Option A — local Docker Postgres (fastest for local dev):**

```bash
docker compose up -d
```

Runs Postgres on **port 5433** (not the default 5432, to avoid clashing with other local Postgres containers).

- name: quickcart
- username: quickcart
- password: quickcart123

**Option B — free hosted Postgres (Neon), for anything beyond your own laptop:**

1. Go to [neon.tech](https://neon.tech) and create a free account/project (no credit card required on the free tier).
2. Create a database named `quickcart` (or use the default one Neon gives you).
3. Copy the connection details Neon shows you and set them as environment variables before starting the backend:

```bash
export DB_URL="jdbc:postgresql://<your-neon-host>/<your-db>?sslmode=require"
export DB_USERNAME="<your-neon-user>"
export DB_PASSWORD="<your-neon-password>"
```

The backend reads `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` from the environment and falls back to the local Docker Postgres (port 5433) if they're unset.

## 2. Start Backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows:

```bash
mvnw.cmd spring-boot:run
```

Backend: http://localhost:8080
Health check: http://localhost:8080/api/health

On first run, demo stores and products (with real photos, one set per vertical) are seeded automatically. A background job then auto-advances every placed order through `PLACED → CONFIRMED → PREPARING → OUT_FOR_DELIVERY → DELIVERED` and moves its delivery marker toward a demo delivery point, so tracking has something real to show without any real courier.

## 3. Start Web

```bash
cd web
npm install
npm run dev
```

Web: http://localhost:5173

Sign up, pick a vertical (Food/Grocery/Medicine/Shop), open a store, add items, checkout with the demo card form, then watch the order status and map update live on the tracking page.

## 4. Start Mobile

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS) or press `i` for the iOS simulator. The mobile app mirrors the web app's flow (verticals → store → cart → checkout → live tracking).

Note: `localhost:8080` in `services/api.js` works out of the box for the iOS simulator. For a physical device or Android emulator, set `EXPO_PUBLIC_API_URL` to your machine's LAN IP (e.g. `http://192.168.1.23:8080/api`) instead. Also note `react-native-maps` uses Apple Maps on iOS for free with no setup; Android's default provider is Google Maps, which needs a (free-tier, but billing-enabled) Google Maps API key to render — not configured here since the app targets iOS.

## Deployment (later)

Not done yet — the plan is web → Netlify, backend → a free host like Render or Railway (Netlify doesn't run Java), database → Neon. We'll set this up once the local app is confirmed working end-to-end.
