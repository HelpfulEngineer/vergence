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
