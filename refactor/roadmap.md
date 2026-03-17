# Refactor Roadmap

## Goals

- Make the codebase easier to understand and extend
- Reduce oversized route files and move reusable logic into feature modules
- Separate Shopify API code, domain logic, and UI composition cleanly
- Standardize naming, file ownership, and verification

## Target Structure

```text
app/
  modules/
    bundles/
      editor/
      product-page/
      service/
      repository/
    shopify/
      admin/
      products/
    shared/
      formatters/
      ui/
      utils/
  routes/
    ...thin route entry points only
refactor/
  roadmap.md
  task-board.md
  review-checklist.md
```

## Workstreams

### R1 - Bundle Editor Route Decomposition

- Split `app/routes/app.bundles.$bundleId.jsx`
- Extract helper functions, state helpers, styles, and presentational pieces
- Leave loader/action wiring in the route file

### R2 - Bundle Product Page Decomposition

- Split `app/routes/app.bundle-product.$bundleId.jsx`
- Move page helpers, styles, icons, and server helpers into feature modules

### R3 - Shopify Product Sync Service Split

- Break `app/modules/shopify/products.server.js` into smaller modules
- Separate GraphQL documents, product mapping, media sync, and metafield sync

### R4 - Shared Formatting and UI Primitives

- Extract duplicated formatters, icons, and inline style objects where reuse exists
- Create a shared home for common bundle UI primitives

### R5 - Bundle Domain Layer Cleanup

- Standardize naming across repository and service functions
- Keep validation, hydration, and persistence concerns separated

### R6 - Route and Project Hygiene

- Stop route files from becoming stateful monoliths
- Isolate local logs and generated artifacts from normal source files
- Normalize folder ownership and keep feature concerns grouped

### R7 - Verification Baseline

- Add a repeatable smoke-check process for route refactors
- Require compile/dev verification for every completed refactor task

## Sequencing

1. R1 Bundle Editor Route Decomposition
2. R2 Bundle Product Page Decomposition
3. R3 Shopify Product Sync Service Split
4. R5 Bundle Domain Layer Cleanup
5. R4 Shared Formatting and UI Primitives
6. R6 Route and Project Hygiene
7. R7 Verification Baseline
