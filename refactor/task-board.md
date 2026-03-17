# Refactor Task Board

## Status Legend

- `todo`
- `in_progress`
- `review`
- `done`

Only one task may be `in_progress` at a time.

## Active Queue

| ID | Status | Owner | Task | Scope | Verification |
| --- | --- | --- | --- | --- | --- |
| R1 | done | Agent 1 | Bundle Editor Route Decomposition | Split `app/routes/app.bundles.$bundleId.jsx` into smaller feature-owned modules while preserving current behavior | `npm exec react-router dev` starts, route flow unchanged, no duplicated helper logic left behind |
| R2 | done | Agent 1 | Bundle Product Page Decomposition | Split `app/routes/app.bundle-product.$bundleId.jsx` into smaller feature-owned modules | Page still saves and loads bundle product data |
| R3 | in_progress | Agent 2 | Shopify Product Sync Service Split | Break `app/modules/shopify/products.server.js` into focused modules | Bundle product sync still creates media/metafields |
| R4 | todo | Agent 1 | Shared Formatting and UI Primitives | Extract reusable formatters, icons, and view primitives | No duplicate copies of shared helpers remain |
| R5 | todo | Agent 1 | Bundle Domain Layer Cleanup | Clarify service and repository boundaries | Bundle CRUD and hydrate flows still work |
| R6 | todo | Agent 1 | Route and Project Hygiene | Clean source ownership and local artifact handling | Source tree is easier to scan and logs are not treated as app code |
| R7 | todo | Agent 1 | Verification Baseline | Standardize smoke checks for refactor tasks | Review checklist followed on every task |

## Handoff Notes

### Agent 1 - Current Assignment

- R3 is the current task
- Break `app/modules/shopify/products.server.js` into focused sync modules
- Preserve the current media and metafield sync behavior

### Agent 2 - Implementation Notes

- Completed R2
- `app/routes/app.bundle-product.$bundleId.jsx` is now a thin route entry with loader/action wiring only
- Extracted bundle product UI into `app/modules/bundle-product/screen.jsx`
- Extracted bundle product server flow into `app/modules/bundle-product/page.server.js`
- Extracted bundle product helpers and shared status constants into `app/modules/bundle-product/helpers.js` and `app/modules/bundle-product/constants.js`
- Retained extracted styles in `app/modules/bundle-product/styles.js`

### Agent 3 - Review Notes

- `npm exec react-router dev` starts after the refactor
- The bundle product route now stays thin while server logic and UI live under `app/modules/bundle-product`
- Remaining risk: this task was compile-verified in the sandbox but not manually clicked through in a browser session
- R2 approved

