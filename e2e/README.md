# E2E Tests

This directory contains end-to-end tests using Playwright to ensure navigation and DOM manipulation work correctly.

## Running Tests

```bash
# Run all tests
npm run test:e2e

# Run tests with UI
npm run test:e2e:ui

# Debug tests
npm run test:e2e:debug
```

## Test Coverage

- Navigation between pages (home → friend → admin)
- Rapid navigation scenarios
- DOM manipulation error detection
- YouTube player initialization across navigation

## What We Test

The tests specifically check for:

- `removeChild` errors
- `insertBefore` errors
- `appendChild` errors
- "not a child" DOM errors

These errors indicate conflicts between React's DOM management and third-party libraries (like YouTube IFrame API).
