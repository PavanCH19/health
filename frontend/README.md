# BloodConnect — frontend

React + Vite + Redux Toolkit frontend for the blood-donation backend, rebuilt on top of the
existing project scaffold (package.json, karnataka_data.json, index.html assets).

## Run it

```bash
npm install
cp .env.example .env      # edit VITE_API_URL if your backend isn't on localhost:8080
npm run dev
```

The backend must be running (`/api` context path) and CORS must allow the dev origin
(`http://localhost:5173` by default).

**I could not run `npm install` / `npm run build` in the sandbox (no network access), so please
run the app locally and watch the browser console before relying on this.** I did check every
file for balanced braces/JSX and for matching import names.

## What changed vs. the uploaded project

The uploaded `Pages/`, `features/`, `store/`, `App.css`, `index.css` were replaced. Kept:
`package.json` (added `@reduxjs/toolkit` + `react-redux`, which were used but not listed),
`vite.config.js`, `index.html` structure, `public/`, `src/assets/karnataka_data.json`.

### Correctness / wiring fixes
- **API base URL and shape**: calls now go through one axios client (`src/api/client.js`) that
  reads `VITE_API_URL`, attaches the JWT, and unwraps the backend's `{ status, success, message,
  data }` envelope. Errors read the backend's `message` / `fieldErrors`.
- **Auth**: role comes from the JWT (`role` claim) instead of being guessed or stored separately,
  so it can't drift from what the backend enforces. An expired/invalid token now signs the user
  out (401 handling), instead of leaving the app stuck on a broken session.
- **New-user flow**: after registering, the profile call 404s (no profile yet). That now routes
  to a proper onboarding form instead of erroring or showing a blank dashboard.
- **Donation dates**: sent as `LocalDateTime` in local time (matches what the backend expects),
  with "today" nudged a minute into the past so same-day donations don't fail the backend's
  "date cannot be in the future" check.
- **Hospital verification gating**: "New request" and "Find donors" now check
  `profile.verifiedByAdmin` and explain why they're blocked, instead of letting the hospital hit
  a 403 with no context.
- **Request status**: the "mark as…" buttons only offer the transitions the backend actually
  allows (`src/lib/bloods.js: STATUS_TRANSITIONS`), so you can't try to reopen a fulfilled
  request and get a confusing error.
- **Blood-group compatibility**: donor search and the donor dashboard use real compatibility
  (an O− donor can help any patient) via `src/lib/bloods.js`, matching the backend's
  `DonationRules`, instead of exact-match-only.

### Location search + map (the main ask)
This project's map/search was effectively unimplemented (a static list + placeholder). Rebuilt as:
- **`src/lib/geo.js`** — OpenStreetMap Nominatim search, reverse geocoding, and browser
  geolocation, all throttled to Nominatim's 1 request/second usage policy and cached so retyping
  doesn't refire requests.
- **`src/components/LocationPicker.jsx`** — one component used everywhere a place is picked
  (donor signup, hospital signup, new request, donor search): type-to-search, "use my location",
  click-or-drag a pin on the map, or drill down Karnataka district → taluk → village using the
  bundled dataset. Always resolves to `{ lat, lon, city, district, state }`, which is exactly what
  the backend's profile/request DTOs need.
- **`src/components/MapView.jsx`** — a Leaflet map used both for picking a location and for
  displaying results (donors or requests) as pins colored by urgency/eligibility, with a radius
  circle, click-to-select syncing with the list, and legends.
- **Donor → "Nearby requests"** (`pages/donor/NearbyRequests.jsx`) and **Hospital → "Find
  donors"** (`pages/hospital/FindDonors.jsx`) both use a list-plus-map split layout: click a list
  item to highlight its pin, or a pin to scroll to its card.
- **"Find donors" can search anywhere**, not just around the hospital's saved address — this
  needed a small backend addition (`lat`/`lon` params on `GET /donors/search`), included in the
  updated `health-fixed.zip` from the previous step.

### Design
Replaced the default Vite styling with a small design system (`src/styles/index.css`): CSS
variables for light/dark, a type scale (Bricolage Grotesque for headings, Figtree for body), one
button/field/card/tag vocabulary reused everywhere, a sidebar + topbar app shell, and a
mobile layout (bottom nav, stacked list-over-map). Blood groups render as a drop-shaped badge
instead of plain text throughout.

## Structure
```
src/
  api/          one file per backend resource, all through client.js
  components/   MapView, LocationPicker, BloodPicker, Shell, Toast, Modal, Guards, Icon, ui.jsx
  lib/          bloods.js (compatibility/status rules), geo.js, format.js, hooks.js
  pages/        Landing, Auth, Onboarding, Profile, Notifications, donor/*, hospital/*, admin/*
  store/        Redux Toolkit: authSlice (session + role-specific profile), uiSlice (theme)
  styles/       index.css design system
```

## Known gaps / things to check locally
- Not tested against a running backend (no network in the sandbox) — verify `VITE_API_URL`,
  CORS, and the actual field names once both sides are running together.
- Donor "eligible" phone number is only returned by `/donors/search`, so the nearby-donor map on
  the hospital dashboard/overview doesn't show a call button by design (matches backend scope).
- No pagination anywhere (`/donors/all`, admin users) — fine for a course-sized dataset, not for
  a large one.
- Notification polling is a 60s interval, not push/websocket.
