# FLIP OR SKIP deployment plan

## Recommended URL structure

Use one static hosting project and expose two routes:

- `/desktop/` — desktop app
- `/mobile/` — phone/tablet app

Example:

- `https://app.fliporskip.com/desktop/`
- `https://app.fliporskip.com/mobile/`

This is the recommended first deployment. A separate server for each route is not necessary and adds operational complexity without fixing JavaScript conflicts.

## Why the builds are isolated

Each route has its own HTML entry point. Both load the same calculation engine and controller. There is no device-detection branch that decides which UI to render, and there are no ES-module imports in the deployable build.

## Production checklist

1. Upload the `desktop/`, `mobile/`, and `shared/` folders to a static host preserving their relative paths.
2. Confirm HTTPS is active.
3. Open `/desktop/?selftest=1` and `/mobile/?selftest=1`.
4. Confirm the page reports 11/11 passed.
5. Test manually on a desktop browser, iPhone, and tablet.
6. Test the two public URLs without `selftest=1`.
7. Only after those pass should the marketing/listing links point at the public app URLs.

## Later PWA work

The entry points already include manifests. Proper app icons, service-worker caching, install prompts, analytics, and offline behavior should be added only after the hosted calculator passes real-device QA. Do not introduce a service worker during the initial functional validation; cached broken code is harder to debug.
