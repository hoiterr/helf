# helf — Health Data Integration & Backend Analysis

> Status: research / planning doc. Goal: assess how well we can connect Garmin,
> Whoop, Apple Health, Fitbit and other popular devices into one fitness platform
> that structures training on a calendar, tracks recovery, and surfaces smart,
> threshold- and AI-driven suggestions.
>
> Last researched: June 2026. **API terms in this space change constantly —
> re-verify before committing to any vendor.**

---

## 1. TL;DR / the one thing to understand first

There are **two fundamentally different classes of integration**, and this split
drives the entire backend architecture:

| Class | Examples | How you get data | Needs a mobile app? |
|-------|----------|------------------|---------------------|
| **Cloud-to-cloud (server-side)** | Garmin, Whoop, Oura, Polar, Fitbit/Google Health, Strava, Withings | OAuth2 + the vendor's REST API + webhooks. Your **backend** talks to their cloud. | No |
| **On-device only** | **Apple Health (HealthKit)**, **Android Health Connect** (incl. Samsung Health, and increasingly Fitbit) | Data lives on the phone. A **native app** reads it locally and pushes to your backend. | **Yes** |

**The single most important fact: Apple Health has no cloud API.** There is no
server endpoint you can call to "pull" a user's Apple Health data. The data is
stored locally on the iPhone and is only readable by a **native iOS app** the user
installs and grants permission to. The same on-device model applies to Android via
**Health Connect**. ([Apple HealthKit docs](https://developer.apple.com/documentation/healthkit), [What you can/can't do with HealthKit](https://www.themomentum.ai/blog/what-you-can-and-cant-do-with-apple-healthkit-data))

Consequence: **if you want Apple Watch / iPhone health data (and you do — it's the
most common device), you must ship a mobile app.** A pure web app + backend can
integrate Whoop, Oura, Garmin, Polar, Fitbit, Strava, etc., but it physically
cannot read Apple Health or Samsung Health without an app on the device.

The second most important decision is **build vs. buy**: integrate each vendor
directly, or sit on top of an **aggregator** (Terra, Rook, Vital, Spike, Thryve)
that gives you one API + one mobile SDK for 300–1000+ devices. More on that in §4.

---

## 2. Per-platform reality check

### Garmin — rich data, but gated, and the program is currently suspended ⚠️
- **Access model:** Garmin Connect Developer Program (Health API + Activity API).
  You must apply **as a legal entity** (company/research/clinical) via an access
  request form — personal-use apps are rejected. Not self-serve.
- **🚩 As of this research, Garmin's developer program is reported to be
  *suspended* with no announced resumption date** — you can't get fresh direct
  access right now. This is the single biggest reason to consider an aggregator,
  which may still broker Garmin access.
- **Data:** very rich — heart rate, steps, calories, sleep, respiration, SpO2,
  stress, body composition, all-day "epoch" summaries, plus full activity files.
- **Delivery:** **webhook/push-only** (Garmin pings your callback URL when a user
  syncs their device to Garmin Connect). There's no general REST polling — you
  react to pushes. Latency ≈ whenever the user's watch syncs to Garmin Connect.
- Sources: [Garmin Health API](https://developer.garmin.com/gc-developer-program/health-api/), [Program FAQ](https://developer.garmin.com/gc-developer-program/program-faq/), [Why integrate Garmin directly (Spike)](https://www.spikeapi.com/blog/why-integrate-garmin-api-directly)

### Whoop — the easiest premium integration ✅
- **Access model:** **self-serve and free.** Create an app on
  developer.whoop.com, OAuth2, done. (You need a Whoop device + membership to test.)
- **Data (v2 API):** Recovery (recovery score, **HRV as RMSSD ms**, resting HR,
  SpO2, skin temp), Sleep (performance, stages), Cycles/Strain, Workouts.
- **Delivery:** OAuth2 + **webhooks** for near-real-time notification of new data;
  refresh tokens hourly. Note Whoop is a **daily-cadence** source — recovery only
  exists *after* the user wakes and the sleep cycle closes, not a live stream.
- Sources: [WHOOP API docs](https://developer.whoop.com/api/), [Recovery endpoint](https://developer.whoop.com/docs/developing/user-data/recovery/), [Webhooks](https://developer.whoop.com/docs/developing/webhooks/), [v1→v2 migration](https://developer.whoop.com/docs/developing/v1-v2-migration/)

### Oura — best-in-class sleep/HRV, easy access ✅
- **Access model:** self-serve registered API app, OAuth2. **Limited to 10 users
  until Oura approves your app** (then unlimited). Personal access tokens were
  **deprecated Dec 2025** — OAuth2 only now.
- **Data (v2 API):** daily readiness, sleep, **5-minute-interval HRV across the
  whole night** (standout feature), body temperature, SpO2, activity.
- Sources: [Oura API v2 docs](https://cloud.ouraring.com/v2/docs), [The Oura API](https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API)

### Polar — self-serve, good for endurance athletes ✅
- **Access model:** **self-serve**, register at the Polar developer portal,
  OAuth2 (AccessLink). No approval wait.
- **Data:** training sessions, sleep, HRV, resting HR, plus Polar-specific metrics
  (Nightly Recharge, ANS Charge, Training Effect).
- Sources: [Polar API guide](https://openwearables.io/blog/polar-api-training-hrv-nightly-recharge-data)

### Fitbit — mid-transition to Google Health API ⚠️ (timing matters in 2026)
- **Access model today:** Fitbit Web API (OAuth2). **But it's being deprecated.**
- **🚩 Timeline:** Fitbit is moving to the new **Google Health API**. Legacy Fitbit
  Web API endpoints are slated for **decommission by ~September 2026**; new
  integrations target the Google Health API (Google OAuth2). **Tokens do not carry
  over** — every user must re-consent through Google. Intraday data support comes
  in a later phase.
- **Takeaway:** don't build a fresh deep Fitbit integration against the legacy API
  now; target Google Health API, or let an aggregator absorb the migration churn.
- Sources: [Fitbit API deprecation (Thryve)](https://www.thryve.health/blog/fitbit-api-deprecation), [About Google Health API](https://developers.google.com/health/about), [Fitbit → Google Health transition (Validic)](https://help.validic.com/space/VCS/5513478151/Fitbit+to+Google+Health+API+Developer+Transition+Guide)

### Apple Health (HealthKit) — on-device, requires a native iOS app ⚠️
- **No cloud/backend API exists.** Data is stored locally on the iPhone; nothing
  syncs to an Apple cloud you can query.
- To read it you ship a **native iOS app** that requests HealthKit permissions,
  reads locally, and forwards to your backend (HealthKit supports background
  delivery so the app can sync periodically without being open).
- This is the gateway to **Apple Watch** data, which most users have — so it's
  effectively mandatory for a "see everything" product.
- Sources: [HealthKit authorization](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data), [Do you need a mobile app for Apple Health data?](https://www.themomentum.ai/blog/do-you-need-a-mobile-app-to-access-apple-health-data)

### Android — Health Connect is the hub (Google Fit is dying) ⚠️
- **Health Connect** is now the unified on-device store for Android, aggregating
  **Samsung Health, Fitbit, Google Fit** and others. Like Apple, it's **on-device**
  — needs a **native Android app** with the Health Connect SDK and granular
  per-type permissions.
- **🚩 Google Fit REST API is deprecated** — no new signups since May 2024, support
  ends **end of 2026**. Migrate to Health Connect.
- Samsung Health and Fitbit are increasingly reachable *through* Health Connect.
- Sources: [Google Fit deprecation / Health Connect](https://www.thryve.health/blog/google-fit-api-deprecation-and-the-new-health-connect-by-android-what-thryve-customers-need-to-know), [Health Connect comparison guide](https://developer.android.com/health-and-fitness/health-connect/comparison-guide)

### Strava — not a wearable, but huge for athletes ✅
- Self-serve OAuth2 API: activities, GPS routes, heart-rate/power streams,
  segments, social. Great complement for the "training" side (vs. the "recovery"
  side that Whoop/Oura cover). Note Strava's API terms restrict storing/displaying
  other users' data and surfacing it in aggregate — read the terms.

### Summary table

| Platform | Access | Self-serve? | Free? | Delivery | Server-side only? | Notes |
|----------|--------|-------------|-------|----------|-------------------|-------|
| Whoop | OAuth2 | ✅ | ✅ | Webhooks + REST | ✅ | Easiest premium source |
| Oura | OAuth2 | ✅ (10-user cap pre-approval) | ✅ | REST | ✅ | Best HRV/sleep granularity |
| Polar | OAuth2 | ✅ | ✅ | REST | ✅ | Endurance metrics |
| Garmin | Partnership form | ❌ | ✅ | **Webhook-only** | ✅ | **Program suspended ⚠️** |
| Fitbit | OAuth2 → Google Health | ✅ | ✅ | REST + webhooks | ✅ | **Migrating, legacy EOL ~Sep 2026 ⚠️** |
| Apple Health | HealthKit | n/a | ✅ | On-device | ❌ **needs iOS app** | Gateway to Apple Watch |
| Android/Samsung | Health Connect | n/a | ✅ | On-device | ❌ **needs Android app** | Google Fit EOL end-2026 |
| Strava | OAuth2 | ✅ | ✅ | REST + webhooks | ✅ | Activities/social, ToS limits |

---

## 3. Sync model: "on-demand or every hour" — what's actually achievable

Your instinct (on-demand + hourly refresh) is exactly right, and here's the honest
picture of how fresh the data can really be:

- **Webhooks (push) are the gold standard** and where supported they make data
  "near-real-time": the vendor calls your endpoint the moment new data lands, you
  fetch and store it. **Garmin and Whoop are webhook-driven; Fitbit/Google Health
  and Strava support webhooks too.** This removes most polling.
  ([Open Wearables: webhooks vs polling](https://www.themomentum.ai/blog/integrating-wearable-technology-into-your-mobile-health-app))
- **Polling (hourly) is the fallback** for sources without webhooks, or as a
  safety net. ~1-hour interval ≈ ~120 requests/user/day for a source like Whoop —
  cheap and well within rate limits.
- **On-demand "sync now"** = when the user opens the dashboard, trigger an
  immediate fetch (and/or a token-bound refresh) so they never stare at stale data.
- **The hard truth about freshness:** most of this data is **not a live stream**.
  - Recovery/sleep are **morning, daily-cadence** metrics — a recovery score
    *doesn't exist* until the user wakes and the sleep cycle closes. Polling at
    3am gets you nothing new.
  - Device data only reaches the vendor cloud **when the watch/ring syncs** (often
    when the app is opened or over BLE periodically). So "real-time" is bounded by
    the user's own sync behavior, not your backend.
  - For Apple/Android, freshness is bounded by **when your mobile app last ran**
    its background HealthKit/Health Connect read.

**Practical target for v1:** webhooks where available + hourly polling fallback +
on-demand "sync now" button. That yields dashboards that are at most ~1 hour stale
(and usually fresher), which is more than enough for a recovery/training product.

---

## 4. Build vs. buy: direct integrations vs. an aggregator

This is the central backend decision.

### Option A — Direct integrations
- **Pros:** no per-credit fees; full control; richest access to each vendor's
  native fields; cheap at scale.
- **Cons:** you build + maintain N OAuth flows, N webhook handlers, N data schemas,
  and you eat every API migration (e.g., Fitbit→Google Health). **You still have to
  build your own iOS + Android apps for Apple Health / Health Connect.** And
  **Garmin's direct program is currently closed**, so you may not be able to get
  Garmin at all right now.

### Option B — Aggregator (Terra / Rook / Vital / Spike / Thryve)
One unified API + normalized schema across 300–1000+ devices, **plus mobile SDKs
that handle Apple Health and Health Connect for you**, plus they broker Garmin.
- **Terra:** ~1000+ integrations, normalized schema; pricing from **~$399/mo
  (annual) / ~$499/mo (monthly)** incl. 100k credits, tiered down with volume.
  ([Terra pricing](https://tryterra.co/pricing), [Terra](https://tryterra.co/))
- **Rook, Vital, Spike, Thryve:** similar value props (Vital also adds **lab
  testing**); pricing mostly **opaque / contact-sales**.
  ([Rook vs Terra/Spike/Thryve](https://www.tryrook.io/competitors))
- **Pros:** ship in days not months; one schema; they absorb API churn; Garmin +
  Apple + Android included.
- **Cons:** recurring cost (hundreds/mo minimum); credit metering; a third party
  sits in your health-data path (privacy/compliance + vendor lock-in); slightly
  less access to exotic native fields.

### Recommendation for this project
A **hybrid, phased** approach:

1. **Start on an aggregator** (Terra or Rook) to get Apple Health, Android/Health
   Connect, **Garmin**, and the long tail of devices working immediately with one
   SDK — this sidesteps the Garmin program suspension and the Fitbit/Google Health
   migration entirely.
2. **Add the easy, free direct integrations** where they add value and save credits
   — **Whoop, Oura, Polar, Strava** are all self-serve OAuth2 and cheap to own.
3. Keep an **internal normalized schema** (your own canonical model) regardless of
   source, so swapping a direct integration for an aggregator one (or vice-versa)
   never touches your product code.

This gets you to a working "see everything" dashboard fastest while keeping
long-term cost and control levers in your hands.

---

## 5. Recommended backend architecture (greenfield)

```
                 ┌────────────────────────────────────────────────┐
   Mobile apps   │  iOS (HealthKit)   Android (Health Connect)     │  ← required for
   (thin)        │  read on-device, push to backend                │    Apple/Samsung/Watch
                 └───────────────┬────────────────────────────────┘
                                 │ HTTPS
 Cloud sources ───webhooks/REST──┤
 (Whoop, Oura,                   ▼
  Garmin, Polar,        ┌──────────────────┐   normalize   ┌──────────────────┐
  Fitbit, Strava,       │  Ingestion layer │──────────────▶│ Canonical schema │
  + Aggregator) ───────▶│  (OAuth, webhook │               │ (your own model: │
                        │   handlers,      │               │  sleep, HRV, RHR, │
                        │   poll scheduler)│               │  workouts, load…) │
                        └──────────────────┘               └─────────┬────────┘
                                                                     │
                        ┌───────────────────────────────────────────┼─────────┐
                        ▼                       ▼                     ▼         ▼
                 Recovery/readiness     Training-load engine    Rules engine   AI/insights
                 scoring                (CTL/ATL/TSB, ACWR)     (thresholds)   (LLM coach)
                        └───────────────────────┬───────────────────────────────┘
                                                ▼
                                    Calendar + dashboard API
                                    (training plan, recovery view,
                                     latest-activity stats, suggestions)
```

**Suggested stack (one sane default — adjust to taste):**
- **API/backend:** TypeScript (NestJS/Fastify) or Python (FastAPI). Either is fine;
  pick what you'll move fastest in.
- **DB:** PostgreSQL for relational/user/plan data **+ a time-series store**
  (TimescaleDB extension, or Postgres + partitioning) for the high-volume
  intraday/HR/HRV samples.
- **Async:** a queue (Redis/BullMQ, or Celery/SQS) for webhook processing + the
  hourly poll scheduler, so ingestion never blocks the API.
- **Token store:** encrypted at rest (OAuth refresh tokens are sensitive secrets).
- **Mobile:** React Native or Flutter if you want one codebase for the thin
  HealthKit/Health Connect reader app; native if you want max reliability on
  background delivery.
- **Canonical schema first:** define your own normalized metrics model on day one;
  every source maps into it. This is the most important long-term decision.

**Compliance note:** this is health data. Even pre-clinical, plan for encryption in
transit + at rest, granular consent, per-source revoke, data-deletion/export, and
clear privacy terms. If you ever touch the US clinical space, HIPAA enters; in the
EU, GDPR treats this as special-category data. Aggregators help here but don't
absolve you.

---

## 6. What else to integrate — and why it benefits the user

You asked what *else* could be valuable. Grouped by the gap each one fills:

**Close the "energy in vs. energy out" loop (nutrition):**
- **MyFitnessPal, Cronometer** — calories/macros in. Pair with burn data to make
  recovery/training advice actually accurate. High user value, differentiates from
  pure wearable apps.

**Body & metabolic signals:**
- **Withings** (smart scales, blood pressure, also sleep mats) — weight/body-comp
  trends, BP. Easy OAuth API.
- **Eight Sleep** — sleep environment/temperature, another recovery input.
- **Continuous glucose: Dexcom / Abbott Libre / Levels** — metabolic response to
  food and training. Increasingly popular with serious athletes and biohackers; a
  strong premium differentiator.

**Training & performance:**
- **Strava** (already covered) — activities, routes, social, segments.
- **TrainingPeaks-style load metrics** — you can *compute* these yourself (see §7).

**Context that makes suggestions smarter:**
- **Calendar (Google/Apple/Outlook)** — schedule workouts around the user's real
  life; suggest when to train hard vs. recover.
- **Weather/air quality** — adjust outdoor session recommendations.
- **Menstrual cycle tracking** — cycle-aware training for female athletes (major,
  under-served value).
- **Subjective journaling** — RPE, soreness, mood, motivation. Cheap to build,
  hugely improves the quality of any readiness model or AI coach.

---

## 7. The "smart suggestions" layer (your precoded thresholds + AI)

This is where the product becomes more than a dashboard. Two complementary engines:

**(a) Deterministic rules engine — your "precoded thresholds".**
Transparent, explainable, runs instantly. Examples:
- `HRV today < 7-day baseline − 1 SD` **and** `sleep < 6h` → flag "go easy, swap
  intervals for Zone 2."
- `resting HR > baseline + 5 bpm for 2 days` → "possible fatigue/illness — deload."
- `acute training load ≫ chronic load` → injury-risk warning.
Make every threshold **config-driven** (per-user, tunable) rather than hardcoded.

**(b) Computed sports-science models** (industry-standard, not guesswork):
- **CTL / ATL / TSB** (Chronic/Acute Training Load & "form" — the TrainingPeaks
  model) for fitness/fatigue/freshness over time.
- **ACWR** (Acute:Chronic Workload Ratio) — the standard injury-risk indicator;
  "sweet spot" vs. spike detection.
- A **unified readiness score** blending HRV, RHR, sleep, prior load, subjective
  input — your own version of Whoop Recovery / Oura Readiness, but cross-device.

**(c) AI/LLM layer on top** ("any AI into it"):
- **Narrative insight:** turn the numbers into plain-language daily briefings
  ("Your HRV dipped and you slept 5h40 — I moved tomorrow's threshold run to
  Thursday and made today Zone 2").
- **Conversational coach:** ask "why am I tired this week?" and get a grounded
  answer over the user's own data.
- **Plan generation/adaptation:** propose and auto-shuffle the training calendar
  based on recovery + the rules above.
- Architecturally: the rules/computed models do the **trustworthy math**; the LLM
  does **explanation, conversation, and planning** over those structured outputs
  (so suggestions stay grounded and auditable, not hallucinated).

---

## 8. Honest risks & gotchas

- **Garmin direct access is currently closed** — plan around an aggregator for
  Garmin, or wait. Don't promise Garmin on a fixed date assuming direct access.
- **Fitbit is mid-migration (legacy EOL ~Sep 2026)** and **Google Fit dies end of
  2026** — build against Google Health API / Health Connect, not the legacy APIs.
- **No Apple Health / Samsung without shipping mobile apps.** Budget for this early;
  it's the difference between "web dashboard" and "see everything."
- **Data is daily-cadence and sync-bound, not a live stream** — set product
  expectations accordingly; "real-time" is bounded by the user's device syncing.
- **Aggregators cost real money and add a third party to your health-data path** —
  great for speed, but model the recurring cost and the privacy/lock-in trade-off.
- **Health data = compliance** from day one (consent, encryption, deletion/export,
  GDPR special-category; HIPAA if you go clinical/US).
- **OAuth token lifecycle** (hourly refresh on Whoop, re-consent on Fitbit→Google)
  is a real maintenance surface — centralize it.

---

## 9. Suggested next steps

1. **Decide build vs. buy for v1** (recommend: aggregator for Apple/Android/Garmin
   + direct Whoop/Oura/Polar/Strava). 
2. **Pick the aggregator** via a short spike: sign up for Terra and Rook trials,
   push your own Whoop/Garmin data through both, compare schema quality + cost.
3. **Design the canonical metrics schema** (sleep, HRV, RHR, workouts, load, daily
   readiness) — this is the foundation everything else maps into.
4. **Stand up the ingestion skeleton:** OAuth + one webhook handler (start with
   Whoop — easiest) + hourly poll scheduler + token store.
5. **Build the thin iOS HealthKit reader** (and Android Health Connect) — or rely
   on the aggregator's mobile SDK for v1.
6. **Implement the calendar + dashboard API** over the canonical schema.
7. **Layer the rules engine** (configurable thresholds) and the CTL/ATL/TSB + ACWR
   computations.
8. **Add the AI insight/coach layer** over the structured outputs.

---

## Sources
- Garmin: [Health API](https://developer.garmin.com/gc-developer-program/health-api/) · [Program FAQ](https://developer.garmin.com/gc-developer-program/program-faq/) · [Spike: integrating Garmin](https://www.spikeapi.com/blog/why-integrate-garmin-api-directly)
- Whoop: [API docs](https://developer.whoop.com/api/) · [Recovery](https://developer.whoop.com/docs/developing/user-data/recovery/) · [Webhooks](https://developer.whoop.com/docs/developing/webhooks/) · [v1→v2](https://developer.whoop.com/docs/developing/v1-v2-migration/)
- Oura: [API v2 docs](https://cloud.ouraring.com/v2/docs) · [The Oura API](https://support.ouraring.com/hc/en-us/articles/4415266939155-The-Oura-API)
- Polar: [API guide](https://openwearables.io/blog/polar-api-training-hrv-nightly-recharge-data)
- Fitbit/Google Health: [Fitbit deprecation](https://www.thryve.health/blog/fitbit-api-deprecation) · [About Google Health API](https://developers.google.com/health/about) · [Validic transition guide](https://help.validic.com/space/VCS/5513478151/Fitbit+to+Google+Health+API+Developer+Transition+Guide)
- Apple Health: [HealthKit](https://developer.apple.com/documentation/healthkit) · [Authorizing access](https://developer.apple.com/documentation/healthkit/authorizing-access-to-health-data) · [Can/can't do with HealthKit](https://www.themomentum.ai/blog/what-you-can-and-cant-do-with-apple-healthkit-data)
- Android/Health Connect: [Google Fit deprecation / Health Connect](https://www.thryve.health/blog/google-fit-api-deprecation-and-the-new-health-connect-by-android-what-thryve-customers-need-to-know) · [Comparison guide](https://developer.android.com/health-and-fitness/health-connect/comparison-guide)
- Sync model: [Integrating wearables (webhooks vs polling)](https://www.themomentum.ai/blog/integrating-wearable-technology-into-your-mobile-health-app)
- Aggregators: [Terra pricing](https://tryterra.co/pricing) · [Terra](https://tryterra.co/) · [Rook vs competitors](https://www.tryrook.io/competitors)
