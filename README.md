# FLIP OR SKIP — Production Foundation V2

## Architecture

- `shared/calculator.js` — single source of truth for calculations. Classic browser script; no ES modules and no DOM dependency.
- `shared/app.js` — shared UI controller for both entry points.
- `shared/styles.css` — FLIP OR SKIP visual system.
- `desktop/index.html` — dedicated desktop entry point.
- `mobile/index.html` — dedicated phone/tablet entry point.

## Intended production links

Host the two folders as separate routes or subdomains, for example:

- `https://app.fliporskip.com/desktop/`
- `https://app.fliporskip.com/mobile/`

Different servers are optional. The isolation comes from separate entry points and shared, deterministic business logic—not from DNS or server separation.

## Repository layout

- `site/` — production files served by the host
- `site/desktop/` — desktop entry point
- `site/mobile/` — mobile/tablet entry point
- `site/shared/` — shared calculation engine, controller and visual system
- `tests/` — deterministic engine/controller checks
- `.github/workflows/qa.yml` — automatic QA on pushes and pull requests
- `docs/` — deployment and QA notes
- `AI_WORKFLOW.md` — rules for future human/AI contributors

## Current release gate

Do not add new product features until the hosted desktop and mobile/tablet entry points pass live-device validation. A dedicated mobile/tablet visual polish pass follows that validation.
