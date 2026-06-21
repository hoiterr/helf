# helf

A unified fitness & recovery platform: ingest data from multiple health devices,
structure training on a calendar, track recovery, and surface threshold- and
AI-driven suggestions.

This repo currently contains the **backend ingestion spine** plus a complete
**WHOOP** integration as the reference vertical slice. The architecture isolates
every data source behind a canonical schema, so new providers (Oura, Polar,
Withings, Eight Sleep — and Garmin via an aggregator) drop in without touching
product, analytics, or dashboard code.

> See [`docs/integrations-analysis.md`](docs/integrations-analysis.md) for the full
> platform-by-platform analysis (access models, sync, build-vs-buy, roadmap) and
> **why Garmin currently requires an aggregator** (its direct developer program is
> suspended to new applicants).

## Architecture at a glance

```
Cloud providers ──OAuth2 + webhooks/REST──▶ Ingestion ──normalize──▶ Canonical schema
 (Whoop now; Oura/Polar/                    (connect,                 (sleep, recovery,
  Withings/Garmin next)                      webhook, sync)            workouts, …)
                                                                            │
                                            Analytics (CTL/ATL/TSB, ACWR)   │
                                            + Rules engine (thresholds) ◀───┤
                                                       │                    │
                                                       ▼                    ▼
                                              Dashboard / calendar read API
```

Key idea: **a provider = one class implementing `HealthProvider`**
(`src/providers/provider.interface.ts`). Nothing downstream knows which device
data came from.

## Tech stack

- **NestJS** (TypeScript) + **Prisma** + **PostgreSQL**
- OAuth tokens are **AES-256-GCM encrypted at rest**
- **Webhooks** for near-real-time updates + **hourly polling** fallback + on-demand
  "sync now"

## Project layout

| Path | Purpose |
|------|---------|
| `prisma/schema.prisma` | The canonical health-data schema (the foundation) |
| `src/canonical/` | Provider-agnostic record shapes normalizers emit |
| `src/providers/` | `HealthProvider` contract, registry, and the WHOOP integration |
| `src/connections/` | Per-user provider connections + encrypted token storage |
| `src/ingestion/` | Idempotent upserts of canonical records |
| `src/sync/` | On-demand + webhook + hourly-poll orchestration |
| `src/integrations/` | OAuth connect/callback + WHOOP webhook HTTP endpoints |
| `src/analytics/` | Training load (CTL/ATL/TSB/ACWR) + threshold rules engine |
| `src/dashboard/` | Assembled read model for the calendar/dashboard UI |

## Getting started (zero-config)

No database to install — helf runs on a local **SQLite** file out of the box.

```bash
npm install
npm run dev
```

`npm run dev` does everything: creates `.env` from the example, generates the
Prisma client, creates & syncs the local DB (`prisma/dev.db`), seeds a demo user
(`demo-user` / demo@helf.app) with templates and today's plan, then starts the API
on `http://localhost:3000` in watch mode. Open `/users/demo-user/today` and you'll
see live data immediately.

Handy scripts: `npm run db:seed` (re-seed), `npm run db:reset` (wipe + reseed),
`npm run db:studio` (browse the DB).

> **Production / Postgres:** the schema is portable. Set `provider = "postgresql"`
> in `prisma/schema.prisma` and point `DATABASE_URL` at your Postgres — no model
> changes needed. To connect real devices, add `WHOOP_*` vars (create an app at
> developer.whoop.com) and a 32-byte `TOKEN_ENCRYPTION_KEY` (`openssl rand -hex 32`).

## Key endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/health` | Liveness check |
| `POST` | `/users` | Create a user (`{ email, name? }`) |
| `GET`  | `/users/:id` | User + connections |
| `GET`  | `/providers/whoop/connect?userId=...` | Start WHOOP OAuth |
| `GET`  | `/providers/whoop/callback` | OAuth callback (stores tokens, backfills) |
| `POST` | `/providers/whoop/webhook` | WHOOP webhook (signature-verified) |
| `POST` | `/connections/:id/sync` | On-demand "sync now" |
| `GET`  | `/users/:userId/dashboard` | Recovery + sleep + load + recommendation |

## Adding a provider

1. Implement `HealthProvider` (OAuth + `fetchSince` → `CanonicalBatch`), like
   `src/providers/whoop/whoop.provider.ts`.
2. Add a normalizer mapping its payloads to canonical records.
3. Register it in `ProviderRegistry` and add the value to `Provider` in
   `src/domain/enums.ts`.

Oura, Polar, and Withings are open/self-serve and follow this pattern directly.
For **Garmin**, the same `fetchSince` slot is fed by an aggregator (Terra/Rook)
until Garmin's direct program reopens.

## Status / roadmap

- [x] Canonical schema + ingestion spine
- [x] WHOOP integration (OAuth, webhook, normalize, sync)
- [x] Training-load analytics + threshold rules engine
- [x] Dashboard read API
- [ ] Oura, Polar, Withings, Eight Sleep providers
- [ ] Garmin via aggregator
- [ ] Auth/users hardening (real sessions, signed OAuth state)
- [ ] Training calendar / plan model
- [ ] Nutrition + CGM integrations
- [ ] AI insight/coach layer over the structured outputs
