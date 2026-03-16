const PRODUCT_FIELDS = `
  id
  title
  handle
  status
  featuredImage {
    altText
    url
  }
  variants(first: 10) {
    nodes {
      id
      title
      price
      inventoryQuantity
    }
  }
`;

const PRODUCT_SEARCH_QUERY = `#graphql
  query ProductSearch($query: String!, $first: Int!) {
    products(first: $first, sortKey: TITLE, query: $query) {
      nodes {
        ${PRODUCT_FIELDS}
      }
    }
  }
`;

const PRODUCT_NODES_QUERY = `#graphql
  query ProductNodes($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        ${PRODUCT_FIELDS}
      }
    }
  }
`;

const PRODUCT_CREATE_MUTATION = `#graphql
  mutation CreateBundleProduct($product: ProductCreateInput!) {
    productCreate(product: $product) {
      product {
        ${PRODUCT_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PRODUCT_UPDATE_MUTATION = `#graphql
  mutation UpdateBundleProduct($product: ProductUpdateInput!) {
    productUpdate(product: $product) {
      product {
        ${PRODUCT_FIELDS}
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function runAdminQuery(admin, query, variables = {}) {
  const response = await admin.graphql(query, { variables });
  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  return payload.data;
}

function mapProduct(product) {
  if (!product) {
    return null;
  }

  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    status: product.status,
    image: product.featuredImage?.url ?? null,
    imageAlt: product.featuredImage?.altText ?? product.title,
    variants: product.variants?.nodes?.map((variant) => ({
      id: variant.id,
      title: variant.title,
      price: variant.price,
      inventoryQuantity: variant.inventoryQuantity,
    })) ?? [],
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatUserError(error) {
  const field = Array.isArray(error.field) ? error.field.join(".") : error.field;
  return field ? `${field}: ${error.message}` : error.message;
}

function assertProductMutationSucceeded(result, fallbackMessage) {
  const userErrors = result?.userErrors ?? [];

  if (userErrors.length) {
    throw new Error(userErrors.map(formatUserError).join(", "));
  }

  if (!result?.product) {
    throw new Error(fallbackMessage);
  }
}

function buildBundleProductPayload(bundle, productA, productB) {
  return {
    title: bundle.name,
    tags: ["bundle-app", `bundle-id:${bundle.id}`],
    descriptionHtml: [
      "<p>This product was created from a two-product bundle inside the app.</p>",
      "<ul>",
      `  <li>${escapeHtml(productA.title)}</li>`,
      `  <li>${escapeHtml(productB.title)}</li>`,
      "</ul>",
      "<p>Select the variants for both products in the bundle experience before checkout.</p>",
    ].join(""),
  };
}

export async function searchProducts(admin, searchTerm, first = 12) {
  const query = searchTerm?.trim() ? searchTerm.trim() : "";
  const data = await runAdminQuery(admin, PRODUCT_SEARCH_QUERY, {
    first,
    query,
  });

  return data.products.nodes.map(mapProduct);
}

export async function getProductsByIds(admin, ids) {
  if (!ids.length) {
    return [];
  }

  const uniqueIds = [...new Set(ids)];
  const data = await runAdminQuery(admin, PRODUCT_NODES_QUERY, {
    ids: uniqueIds,
  });

  return data.nodes.map(mapProduct).filter(Boolean);
}

export async function pushBundleProductToShopify(
  admin,
  { bundle, existingBundleProductId, productA, productB },
) {
  const product = buildBundleProductPayload(bundle, productA, productB);
  const data = existingBundleProductId
    ? await runAdminQuery(admin, PRODUCT_UPDATE_MUTATION, {
        product: {
          id: existingBundleProductId,
          ...product,
        },
      })
    : await runAdminQuery(admin, PRODUCT_CREATE_MUTATION, { product });

  const result = existingBundleProductId ? data.productUpdate : data.productCreate;

  assertProductMutationSucceeded(
    result,
    existingBundleProductId
      ? "Unable to update the Shopify product for this bundle."
      : "Unable to create a Shopify product for this bundle.",
  );

  return mapProduct(result.product);
}
