# FLIP OR SKIP V2 QA Report

## Passed
- Calculation engine syntax check
- UI controller syntax check
- 3/3 deterministic calculation cases
- 11/11 UI-controller integration checks
- Required DOM IDs present in all deployable pages
- No ES-module deployment dependency
- Desktop and mobile entry points share the same calculation engine

## Browser-runtime note
The workspace Chromium binary was attempted against both file:// and localhost HTTP pages, but the binary failed to return any DOM output and timed out before page rendering because of the execution environment's browser/DBus stack. This is an environment limitation, not being counted as a passing browser test. The application itself contains `?selftest=1`, which executes the same 11 interaction checks in a real browser on the eventual hosted URL.
