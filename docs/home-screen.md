# helf — day-to-day home screen

The home screen answers, in one glance, the only questions an athlete has each
morning: **Am I recovered? What should I do today? Where am I in my plan?** Every
zone earns its place by reducing a decision or a worry. A live wireframe built
from the design system lives in Storybook at **Examples → HomeScreen** — this doc
is the rationale and the data mapping behind it.

## Design principles

- **Decision-first, not data-first.** The top of the screen tells you what to do,
  not just numbers. Charts support the recommendation; they don't replace it.
- **Glanceable.** Color (green/amber/red) and one headline carry the message; you
  shouldn't need to read to know if today is hard, easy, or rest.
- **One screen, no hunting.** Today, vitals, the week, fitness/fatigue, last
  night, and capture all live here. Detail screens are a tap away, never required.
- **Capture in one line.** Quick-add is always reachable so logging/planning never
  feels like a chore.

## Layout (top → bottom = priority)

```
┌────────────────────────────────────────────────────────────┐
│ Good morning, Alex            [Spring Build] [Wk 1/6 · Base]│  Header: who + where in the plan
├────────────────────────────────────────────────────────────┤
│  ◐ 58   Moderate readiness — dialled back where it matters. │  HERO · Readiness gate
│ Readiness  • Under 6h sleep — avoid high intensity          │  (TodayPanel)
│            Heavy lower  HARD → MODERATE  [Accept][Modify][⤬]│  the day's decision, one tap
├────────────────────────────────────────────────────────────┤
│ [Recovery 58%▼] [HRV 61ms▼] [Resting HR 56▲] [Sleep 5h48m▼]│  VITALS · body status (MetricCards)
├────────────────────────────────────────────────────────────┤
│ This week                                                   │  THE WEEK (CalendarWeek)
│ Sun  Mon  Tue  Wed  Thu  Fri  Sat   ← readiness-tinted      │  where today sits + what's coming
├──────────────────────────────┬─────────────────────────────┤
│ Training load                │ Last night                  │  FORM + SLEEP (side by side)
│ Fitness 62  Fatigue 74  Form │ ▓▓▒▒▒░ deep/rem/light/awake │  TrainingLoadCard + SleepStagesBar
│ −12   [ACWR 1.32 · Ramping]  │ 6h32m · 84% efficiency      │
├────────────────────────────────────────────────────────────┤
│ ⚡ Add a workout — “40min zone 2 ride”               [Add]  │  CAPTURE (QuickAddInput)
└────────────────────────────────────────────────────────────┘
```

## Zones → data sources

| Zone | Component(s) | Backend source |
|------|--------------|----------------|
| Plan context (header) | `Badge` | `GET /users/:id/plans` + `/plans/:id/schedule` (current week → block) |
| Readiness gate (hero) | `TodayPanel` | `GET /users/:id/today` (status, score, headline, reasons, adjustments) |
| Vitals row | `MetricCard` ×4 | `GET /users/:id/dashboard` (`latestRecovery`, `baselines`, `lastSleep`) |
| This week | `CalendarWeek` | `GET /users/:id/calendar?from&to` (planned + completed + readiness tint) |
| Training load | `TrainingLoadCard` | `GET /users/:id/dashboard` (`trainingLoad`: ctl/atl/tsb/acwr) |
| Last night | `Card` + `SleepStagesBar` | `dashboard.lastSleep` (stage minutes, efficiency) |
| Capture | `QuickAddInput` | `POST /planning/parse` (live preview) → `POST /users/:id/planned` |

Every value already exists in the API — the home screen is assembled entirely
from endpoints we've shipped. No new backend work is required to wire it.

## Interactions

- **Accept / Modify / Skip** on the readiness gate write straight through:
  Accept → `PATCH /planned/:id` (apply suggested intensity) then it reads as
  planned; Skip → `PATCH /planned/:id { status: SKIPPED }`.
- **Tap a day** in the week strip → that day's detail (planned vs. completed).
- **Quick-add** parses live (`/planning/parse`) and commits to today (or a chosen
  day) with one keystroke.
- **Pull to refresh / morning open** → re-fetch `today` + `dashboard`; the gate
  re-evaluates as new recovery data syncs in.

## Responsive

- **Mobile (1 col):** header → gate → vitals (2×2) → week (horizontal scroll or
  2-wide) → load → sleep → quick-add. The gate and vitals are the above-the-fold
  core.
- **Desktop (multi-col):** vitals in a row; load + last-night side by side; the
  week as a full 7-across strip (the design-system grids already collapse at the
  720/640px breakpoints).

## What's intentionally NOT here

Deep history, per-metric trend charts, settings, device management, and full
plan editing live on dedicated screens. The home screen is a daily cockpit, not
an analytics suite — it shows what changes your behavior today.

## Next step

This wireframe is presentational (Storybook). Turning it into the real screen =
a thin app (React Router/Next) that fetches the endpoints above and drops in
these same components — the planned frontend phase.
