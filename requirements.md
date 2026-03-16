## Shopify Bundle App Requirements

### Core Goals
- Build a **minimal, production-ready Shopify app** that lets merchants bundle two existing Shopify products.
- Keep navigation/pages to two admin views: bundle listing and bundle create/edit.
- Rely entirely on Shopify for product, variant, price, and inventory data; never create new Shopify products or bundle variants.

### Architecture Overview
- **Clean architecture** with clear separation between domain, services, repositories, and Shopify integration.
- Suggested modules:
  * `modules/bundles`: `bundle.controller`, `bundle.service`, `bundle.repository` orchestrate bundle flows.
  * `shopify`: `shopify.service` for Admin API calls + `webhook.handler`.
  * `common`: shared utilities, constants, config, type definitions.
- Use dependency injection to keep services testable. Controller handles HTTP routes, service contains domain logic, repository persists bundle metadata.

### Folder Structure (suggested)
```
modules/
  bundles/
    bundle.controller.ts
    bundle.service.ts
    bundle.repository.ts
shopify/
  shopify.service.ts
  webhook.handler.ts
common/
  config.ts
  types.ts
  utils.ts
web/
  routes/
    bundles/
      list.tsx      # admin list view
      form.tsx      # create/edit view
```

### Database Schema
- Bundles table:
  * `id` (uuid, PK)
  * `name` (string)
  * `product_a_id` (Shopify product ID)
  * `product_b_id` (Shopify product ID)
  * `created_at`, `updated_at`
- Additional join table if variant preferences per bundle are needed.

### Bundle Creation Logic
- Controller validates request and delegates to service.
- Service:
  1. Fetch both products via Shopify API to confirm exist.
  2. Store bundle metadata (name + product IDs) in repository.
  3. Optionally cache variant list for quick front-end population (read-through, invalidated by webhooks).

### Storefront Bundle Logic
- Frontend bundle page fetches bundle metadata (product IDs).
- On load, call Shopify Admin (or Storefront) API to fetch variants for both products.
- Customer selects one variant per product.
- Bundle price calculated as `variantA.price + variantB.price`.
- On "Add to cart", POST to backend endpoint that:
  * verifies variant availability
  * adds both variant IDs with qty 1 to Shopify Checkout / Cart via Storefront API.

### Shopify API Integration
- **shopify.service** wraps Admin and Storefront endpoints:
  * Product retrieval: `/admin/api/.../products/{id}.json?fields=id,title,variants`.
  * Variant lookups for real-time pricing.
  * Cart creation: use Storefront API or Checkout API to add multiple entries atomically.
  * Authentication via OAuth per shop.

### Webhook Implementation
- Required webhooks: `products/update`, `products/delete`, `variants/update`, `orders/create`.
- Handler responsibilities:
  * Invalidate cached product/variant metadata.
  * Delete bundles referencing deleted products.
  * On order creation, optionally log bundle purchases for analytics.
  * Ensure bundle price logic picks up variant price changes immediately.

### Example API Endpoints
- `GET /api/bundles` → list bundles.
- `POST /api/bundles` → create bundle (body: { name, productAId, productBId }).
- `PUT /api/bundles/:id` → update (name/products).
- `DELETE /api/bundles/:id`
- `POST /api/bundles/:id/cart` → add selected variants to cart (body: { variantAId, variantBId }).
- `GET /api/shops/:shop/products?ids=` → product metadata caching helper.

### Minimal Admin UI Design
- **Bundle List Page**
  * Table/list of bundles with actions (edit, delete).
  * "Create bundle" button.
- **Create/Edit Page**
  * Inputs: bundle name, product A dropdown, product B dropdown.
  * Variant selectors dynamically load after product selection (two dropdowns).
  * Save button triggers backend endpoint.

### Explanation
- **Architecture decisions**: modules split by domain, Shopify integration isolated in service layer, repository abstracts persistence, enabling scalable catalogs.
- **Variant handling**: fetch variant sets dynamically via Shopify API per product selection; no pre-generated combinations.
- **Dynamic bundle pricing**: calculate price at runtime from the currently selected variant prices (`variantA.price + variantB.price`).
- **Add to cart flow**: backend endpoint receives chosen variant IDs and uses Shopify Storefront/Checkout API to add both items with individual line items, ensuring Shopify handles inventory.

### Notes
- Keep UI responsive by lazy-loading variant metadata and caching it briefly between webhook invalidations.
- Ensure API routes are protected by shop authentication/middleware.
