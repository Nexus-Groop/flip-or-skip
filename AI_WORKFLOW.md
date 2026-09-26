# AI contribution workflow

FLIP OR SKIP uses a simple rule: no AI-generated change is trusted merely because it compiles.

## Required workflow
1. Work on a branch; do not change `main` directly once branch protection is enabled.
2. State the intended behavior before changing code.
3. Keep calculation logic in `site/shared/calculator.js` independent from the DOM.
4. Keep shared UI behavior in `site/shared/app.js` unless a desktop/mobile difference is intentional.
5. Add or update a deterministic test for every calculation or interaction change.
6. Run `npm test` before proposing the change.
7. Have a separate reviewer (human or AI) inspect the diff and actively look for regressions.
8. Merge only after automated QA passes and the CEO-approved release criteria are met.

## Guardrails
- Preserve the black/green FLIP OR SKIP identity unless a redesign is explicitly approved.
- Do not silently change fee assumptions, verdict thresholds, or financial formulas.
- Treat marketplace fees as estimates and document material assumption changes.
- Mobile/tablet has its own visual polish phase; do not "fix" mobile by destabilizing desktop.
