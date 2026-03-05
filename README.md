# Vergence

Vergence is a React + Vite + TypeScript narrative dice roller for the FFG / Edge Studio Star Wars RPG system.

## Local Development

```bash
npm install
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run test
npm run lint
```

## Notes

- Success odds in the `Never tell me the odds!` intel panel are computed exactly via fraction-based PMF convolution (no Monte Carlo).
- Success odds include only check dice (`Boost`, `Ability`, `Proficiency`, `Setback`, `Difficulty`, `Challenge`) and intentionally exclude `Force` dice.
- Assumption: optional exact odds for `at least one Triumph` / `at least one Despair` were omitted to keep the runtime path 1D, fast, and simple while preserving exact success/failure and expected net success.

## Animation Tuning

- Roll animation timing is controlled by `ROLL_ANIMATION_MS` in [src/App.tsx](src/App.tsx). Default is `420ms`.
- Rolling preview and reveal effects are CSS-driven in [src/App.css](src/App.css) (`results-rolling`, `results-pulse-*`, and related keyframes).

## Reduced Motion

- If the user enables `prefers-reduced-motion`, roll animation delay is reduced to `0ms` and results commit immediately.
- CSS disables scanline, pulse, chip flicker, and spinner animations under `@media (prefers-reduced-motion: reduce)`.
