# helf web

The Next.js frontend — wires the `@helf/ui` design system to the live backend API.
Currently ships the **Home** screen (readiness gate, vitals, the week, training
load + last night, quick-add) and a **Calendar** week planner.

## Run it

The backend must be running first (it serves the API the app reads):

```bash
# terminal 1 — backend (repo root), zero-config SQLite
npm run dev            # → http://localhost:3000

# terminal 2 — this app
cd web
npm install
npm run dev            # → http://localhost:3001
```

`npm run dev` builds the design system first (via `npm run setup`), so component
changes flow through. Open http://localhost:3001 — it loads the seeded demo user.

## Configuration

Copy `.env.example` → `.env` to override defaults:

- `NEXT_PUBLIC_API_URL` — backend base URL (default `http://localhost:3000`)
- `NEXT_PUBLIC_DEMO_USER_ID` — user to load (default `demo-user`, the seeded one)

## Structure

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Home screen (the wired wireframe from `docs/home-screen.md`) |
| `app/calendar/page.tsx` | Week planner — add via templates or quick-add |
| `lib/api.ts` | Typed fetch client for the backend |
| `lib/types.ts` | Response shapes (reuses `@helf/ui` domain unions) |

Every component comes from `@helf/ui`; this app only fetches data and maps it to
props. Auth is not wired yet — it loads the demo user until real sessions land.
