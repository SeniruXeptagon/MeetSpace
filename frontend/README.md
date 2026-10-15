# MeetSpace frontend

Next.js frontend for the meeting room app. Sign-in uses Keycloak's authorization code flow with PKCE. The frontend sends the access token to the backend's authenticated `GET /api/auth/me` endpoint; the backend validates its issuer, signature, expiry, and `meeting-room-api` audience.

## Local setup

1. Start the services in the repository root with `docker compose up -d --build`. This exposes Keycloak at `http://localhost:8081` and the API at `http://localhost:8080`.
2. Open `http://localhost:8081/admin/` and sign in with the Keycloak admin credentials from the root `.env` (or the defaults in `docker-compose.yml`). In the `meeting-room` realm, create an OpenID Connect client with Client ID `meeting-room-frontend`.
3. Configure that client as a **public** client (Client authentication **Off**), with **Standard flow** enabled and PKCE method **S256**. Set Valid redirect URIs to `http://localhost:3000/*`, Valid post logout redirect URIs to `http://localhost:3000/login`, and Web origins to `http://localhost:3000`.
4. Add an **Audience** protocol mapper to the frontend client's dedicated client scope (or a default client scope assigned to it). Set Included custom audience to `meeting-room-api` and Add to access token to **On**. This must match `Keycloak:Audience` in the API configuration. Create a test user in the realm, set a password, and disable the temporary password option if you want to sign in immediately.
5. From `frontend`, copy `.env.example` to `.env.local`, then run `npm install` and `npm run dev`. Visit `http://localhost:3000/login`.

The `.env.example` defaults target the Docker Compose endpoints. If you run the API using its local .NET `http` launch profile instead, set `NEXT_PUBLIC_API_URL=http://localhost:5028` in `.env.local`. If the frontend origin changes, also set the backend's `Frontend__Origin` configuration to that origin and update the Keycloak client redirect and web origin settings. Restart the frontend after changing `NEXT_PUBLIC_` variables.

Sign-in redirects to Keycloak. After returning, the frontend calls `GET /api/auth/me` with the access token. The dashboard and My Bookings pages remain behind the sign-in check. Logout ends the Keycloak session. Tokens stay in the Keycloak adapter's memory; reloading the page checks the Keycloak session again.

Bookings still use in-memory React state and sample data. Creating and cancelling a booking in the UI does not call the backend booking API.

## Verify

Run `npm run build` in `frontend` and `dotnet build backend/MeetingRoom.Api/MeetingRoom.Api.csproj` in the repository root. For a live check, sign in and confirm the browser's Network tab shows `GET /api/auth/me` returning 200. A 401 usually means the token issuer or audience does not match the API configuration; a browser CORS error usually means the frontend origin differs from the configured origin.
