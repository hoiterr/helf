# @helf/ui

The helf design system — React components, design tokens, and styles for the
fitness & recovery platform. Built so the dashboard, training calendar, and
recovery views all render from one on-brand component set that maps 1:1 onto the
backend's data shapes.

This package is also structured to sync to **claude.ai/design** (via the
`/design-sync` skill): it has a Storybook for verified previews and a Vite library
build that emits a compiled `dist/`.

## Components

| Component | Role | Maps to backend |
|-----------|------|-----------------|
| `Button` | Primary/secondary/ghost actions | — |
| `Card` | Surface container with header/actions | dashboard grid |
| `Badge` | Status label (success/warning/danger) | provider tags, states |
| `MetricCard` | Stat tile with trend | HRV, resting HR, sleep, strain |
| `ScoreRing` | Circular 0–100 gauge, color by threshold | `dailyRecovery.score` |
| `SleepStagesBar` | Stacked sleep-stage bar | `sleepSession` stage minutes |
| `ReadinessBanner` | Daily verdict + reasons | rules-engine `recommendation` |

The `Examples/Dashboard` story composes them into the exact payload returned by
`GET /users/:id/dashboard`.

## Styling idiom

- **Design tokens are global CSS variables** (`--helf-*`) defined in
  `src/tokens/tokens.css`. Theme via `[data-theme="dark"]`.
- Components are **self-styled** with plain CSS classes namespaced `helf-*`; there
  is no CSS-in-JS and no utility framework.
- Wrap a screen in `.helf-root` to establish background, font, and base color.

## Develop

```bash
npm install
npm run storybook      # interactive component explorer at :6006
npm run build          # vite library build → dist/ (+ type declarations)
npm run typecheck      # strict tsc, no emit
```

## Add a component

1. `src/components/<Name>/<Name>.tsx` + `<Name>.css` (style from `--helf-*` tokens).
2. `src/components/<Name>/<Name>.stories.tsx` with representative stories.
3. Export it from `src/index.ts`.
