# MeetSpace frontend

A responsive meeting room booking UI built with Next.js. It includes a login preview, a scrollable date picker and monthly calendar, a vertical day timeline with minute-level selection, manual time editing, booking confirmation, and a My Bookings page.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The home route opens the dashboard. Visit `/login` to preview the login screen.

Bookings use in-memory React state with sample data. New and cancelled bookings are reflected across pages during the current session and reset on refresh. The login form is a visual demo; it does not authenticate users. Accounts will be created manually through Keycloak.

## Check the build

```bash
npm run build
```
