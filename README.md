# Wagon & Willow — Combined App

Real match records (deterministic) and a statistical match simulator
(probabilistic), in one web app, gated by user accounts.

## Architecture

```
backend/            Flask + SQLAlchemy + SQLite
  models/            User, Team, Player, Match, Innings, PlayerMatchStats, SimulatedMatch
  routes/            auth.py, matches.py, simulations.py
  app.py             Flask entrypoint, Flask-Login wiring
  seed.py            seeds one real fixed match record (deterministic data)
  config.py, .env.example

frontend/            React + Vite
  src/simulator/engine.js   the probabilistic engine — pure functions, no DOM
  src/context/AuthContext.jsx
  src/pages/
    Home.jsx               browse real match records (public)
    MatchDetail.jsx         real scorecard (public)
    Simulator.jsx           run the probabilistic simulator (login required)
    MySimulations.jsx       saved simulation results (login required)
    Login.jsx / Register.jsx
  src/components/ProtectedRoute.jsx
```

## Why this split

- **Deterministic data** (`Match`, `Innings`, `PlayerMatchStats`) is fixed —
  it represents real results and never changes on its own. It lives in the
  database and is public to browse.
- **Probabilistic data** (a simulator run) is generated fresh every time,
  client-side, from `src/simulator/engine.js`. The backend never re-runs or
  validates this math — it only persists the *result* of a run
  (`SimulatedMatch.result_json`) against the logged-in user who ran it.
- Keeping these as separate models rather than forcing them into one schema
  avoids a confusing mix of "this row is a fact" vs "this row is one
  possible outcome."

## Auth

Session-cookie based (Flask-Login), not JWT — simplest correct choice for a
same-origin (dev: proxied) single-page app. `credentials: 'include'` is set
on every frontend fetch (`src/api/client.js`) so the session cookie flows
both ways.

- `POST /api/auth/register` — email, name, password (min 8 chars)
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me` — returns `{ user: null }` if not logged in (not a 401,
  so the frontend can silently check auth state on load)

The **Simulator** and **My Simulations** pages are gated by `ProtectedRoute`
on the frontend and by `@login_required` on the backend's `/api/simulations`
routes — both layers enforce it, not just the UI.

## Setup

### Backend
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python3 seed.py        # creates the DB and seeds one real match record
python3 app.py          # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev              # http://localhost:5173
```

Run both at once, in separate terminals. Vite proxies `/api/*` to the Flask
server (see `vite.config.js`), so no CORS/URL config is needed in dev beyond
what's already set up.

## What's in v1 vs. what was scoped out

To keep this a shippable, working v1 rather than an unbounded feature
merge, this combined build **does not** include the earlier project's
scraper integrations (Cricbuzz/CricAPI/RapidAPI), the Teams/Series browsing
pages, or the Flask-Admin panel. The architecture (blueprints on the
backend, page-per-route on the frontend) supports adding any of those back
in without restructuring what's here.

## Extending the math

`src/simulator/engine.js` exports a live-mutable `CONFIG` object — the
Simulator page's "Advanced Engine Settings" panel edits it directly, and
`DEFAULT_CONFIG` is kept as a frozen snapshot for the reset button. Add new
tunable constants by adding a key to `CONFIG` and a matching entry to
`CONFIG_FIELDS` in `Simulator.jsx`.
