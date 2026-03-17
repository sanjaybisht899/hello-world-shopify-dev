const BUNDLE_PRODUCTS_METAFIELD = Object.freeze({
  namespace: "bundle_app",
  key: "products",
  type: "list.product_reference",
});

const PRODUCT_FIELDS = `
  id
  title
  descriptionHtml
  handle
  status
  vendor
  productType
  tags
  variantsCount {
    count
  }
  featuredImage {
    altText
    url
  }
  options {
    id
    name
    values
  }
  media(first: 12) {
    nodes {
      alt
      mediaContentType
      ... on MediaImage {
        id
        image {
          altText
          url
        }
        originalSource {
          url
        }
      }
      preview {
        status
        image {
          altText
          url
        }
      }
    }
  }
  bundleProductsMetafield: metafield(namespace: "bundle_app", key: "products") {
    type
    value
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
  mutation CreateBundleProduct($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
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
  mutation UpdateBundleProduct($product: ProductUpdateInput!, $media: [CreateMediaInput!]) {
    productUpdate(product: $product, media: $media) {
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

const METAFIELD_DEFINITION_CREATE_MUTATION = `#graphql
  mutation CreateBundleProductsMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        namespace
        key
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const METAFIELD_DEFINITION_PIN_MUTATION = `#graphql
  mutation PinBundleProductsMetafieldDefinition($identifier: MetafieldDefinitionIdentifierInput!) {
    metafieldDefinitionPin(identifier: $identifier) {
      pinnedDefinition {
        id
        namespace
        key
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

const METAFIELDS_SET_MUTATION = `#graphql
  mutation SetBundleProductMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        type
        value
      }
      userErrors {
        field
        message
        code
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

function parseJsonArray(value) {
  if (!value) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(value);
    return Array.isArray(parsedValue)
      ? parsedValue.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function normalizeMediaImage(mediaNode, fallbackAlt) {
  if (mediaNode?.mediaContentType !== "IMAGE") {
    return null;
  }

  const url = mediaNode.image?.url ?? mediaNode.preview?.image?.url ?? null;

  if (!url) {
    return null;
  }

  return {
    id: mediaNode.id ?? null,
    url,
    originalSource: mediaNode.originalSource?.url ?? url,
    alt:
      mediaNode.alt ??
      mediaNode.image?.altText ??
      mediaNode.preview?.image?.altText ??
      fallbackAlt,
  };
}

function mapProduct(product) {
  if (!product) {
    return null;
  }

  const options = (product.options ?? [])
    .map((option) => ({
      id: option.id,
      name: option.name,
      values: option.values ?? [],
    }))
    .filter((option) => {
      return !(
        option.name === "Title" &&
        option.values.length === 1 &&
        option.values[0] === "Default Title"
      );
    });

  const media = (product.media?.nodes ?? [])
    .map((mediaNode) => normalizeMediaImage(mediaNode, product.title))
    .filter(Boolean);

  return {
    id: product.id,
    title: product.title,
    descriptionHtml: product.descriptionHtml ?? "",
    handle: product.handle,
    status: product.status,
    vendor: product.vendor ?? "",
    productType: product.productType ?? "",
    tags: product.tags ?? [],
    image: product.featuredImage?.url ?? media[0]?.url ?? null,
    imageAlt: product.featuredImage?.altText ?? media[0]?.alt ?? product.title,
    media,
    options,
    bundledProductIds: parseJsonArray(product.bundleProductsMetafield?.value),
    variantCount:
      product.variantsCount?.count ?? product.variants?.nodes?.length ?? 0,
    variants:
      product.variants?.nodes?.map((variant) => ({
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

function assertUserErrorsEmpty(userErrors, fallbackMessage) {
  if (userErrors?.length) {
    throw new Error(userErrors.map(formatUserError).join(", "));
  }

  if (fallbackMessage === null) {
    return;
  }
}

function assertProductMutationSucceeded(result, fallbackMessage) {
  assertUserErrorsEmpty(result?.userErrors ?? [], null);

  if (!result?.product) {
    throw new Error(fallbackMessage);
  }
}

function isIgnorableMetafieldDefinitionError(error) {
  return /already exists|already pinned|taken|must be unique|in use/i.test(
    error?.message ?? "",
  );
}

async function ensureBundleProductsMetafieldDefinition(admin) {
  const definition = {
    name: "Bundled products",
    namespace: BUNDLE_PRODUCTS_METAFIELD.namespace,
    key: BUNDLE_PRODUCTS_METAFIELD.key,
    description: "Products included in this bundle.",
    ownerType: "PRODUCT",
    type: BUNDLE_PRODUCTS_METAFIELD.type,
  };

  const createData = await runAdminQuery(admin, METAFIELD_DEFINITION_CREATE_MUTATION, {
    definition,
  });
  const createErrors = createData.metafieldDefinitionCreate?.userErrors ?? [];

  if (createErrors.some((error) => !isIgnorableMetafieldDefinitionError(error))) {
    throw new Error(createErrors.map(formatUserError).join(", "));
  }

  const pinData = await runAdminQuery(admin, METAFIELD_DEFINITION_PIN_MUTATION, {
    identifier: {
      namespace: BUNDLE_PRODUCTS_METAFIELD.namespace,
      key: BUNDLE_PRODUCTS_METAFIELD.key,
      ownerType: "PRODUCT",
    },
  });
  const pinErrors = pinData.metafieldDefinitionPin?.userErrors ?? [];

  if (pinErrors.some((error) => !isIgnorableMetafieldDefinitionError(error))) {
    throw new Error(pinErrors.map(formatUserError).join(", "));
  }
}

async function syncBundleProductMetafields(admin, ownerId, productIds) {
  const uniqueProductIds = [...new Set(productIds.filter(Boolean))];
  const data = await runAdminQuery(admin, METAFIELDS_SET_MUTATION, {
    metafields: [
      {
        ownerId,
        namespace: BUNDLE_PRODUCTS_METAFIELD.namespace,
        key: BUNDLE_PRODUCTS_METAFIELD.key,
        type: BUNDLE_PRODUCTS_METAFIELD.type,
        value: JSON.stringify(uniqueProductIds),
      },
    ],
  });

  assertUserErrorsEmpty(
    data.metafieldsSet?.userErrors ?? [],
    "Unable to save the bundle product references.",
  );
}

function buildDefaultBundleDescription(productA, productB) {
  return [
    "<p>This product was created from a two-product bundle inside the app.</p>",
    "<p><strong>Bundled products</strong></p>",
    "<ul>",
    `  <li>${escapeHtml(productA.title)}</li>`,
    `  <li>${escapeHtml(productB.title)}</li>`,
    "</ul>",
    "<p>Select the variants for both products in the bundle experience before checkout.</p>",
  ].join("");
}

function buildBundleProductPayload(bundle, productA, productB, overrides = {}) {
  const title = overrides.title?.trim() || bundle.name;
  const vendor = overrides.vendor?.trim();
  const productType = overrides.productType?.trim();
  const status = ["ACTIVE", "ARCHIVED", "DRAFT"].includes(overrides.status)
    ? overrides.status
    : undefined;
  const overrideTags = Array.isArray(overrides.tags)
    ? overrides.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const tags = [...new Set(["bundle-app", `bundle-id:${bundle.id}`, ...overrideTags])];

  return {
    title,
    tags,
    descriptionHtml:
      overrides.descriptionHtml?.trim() ||
      buildDefaultBundleDescription(productA, productB),
    ...(vendor ? { vendor } : {}),
    ...(productType ? { productType } : {}),
    ...(status ? { status } : {}),
  };
}

function getProductMediaSources(product) {
  const media = product?.media?.length
    ? product.media
    : product?.image
      ? [
          {
            url: product.image,
            originalSource: product.image,
            alt: product.imageAlt ?? product.title,
          },
        ]
      : [];

  return media
    .map((image) => ({
      originalSource: String(image.originalSource ?? image.url ?? "").trim(),
      alt: image.alt ?? product?.title ?? "Bundle image",
    }))
    .filter((image) => image.originalSource);
}

function buildBundleProductMediaInputs({ productA, productB, existingBundleProduct }) {
  const existingSources = new Set(
    getProductMediaSources(existingBundleProduct).map((image) => image.originalSource),
  );
  const seenSources = new Set(existingSources);
  const mediaInputs = [];

  for (const product of [productA, productB]) {
    for (const image of getProductMediaSources(product)) {
      if (seenSources.has(image.originalSource)) {
        continue;
      }

      seenSources.add(image.originalSource);
      mediaInputs.push({
        mediaContentType: "IMAGE",
        originalSource: image.originalSource,
        alt: image.alt,
      });
    }
  }

  return mediaInputs.slice(0, 12);
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
  {
    bundle,
    existingBundleProductId,
    existingBundleProduct = null,
    productA,
    productB,
    productOverrides = {},
  },
) {
  const product = buildBundleProductPayload(bundle, productA, productB, productOverrides);
  const media = buildBundleProductMediaInputs({
    productA,
    productB,
    existingBundleProduct,
  });
  const data = existingBundleProductId
    ? await runAdminQuery(admin, PRODUCT_UPDATE_MUTATION, {
        product: {
          id: existingBundleProductId,
          ...product,
        },
        media,
      })
    : await runAdminQuery(admin, PRODUCT_CREATE_MUTATION, {
        product,
        media,
      });

  const result = existingBundleProductId ? data.productUpdate : data.productCreate;

  assertProductMutationSucceeded(
    result,
    existingBundleProductId
      ? "Unable to update the Shopify product for this bundle."
      : "Unable to create a Shopify product for this bundle.",
  );

  await ensureBundleProductsMetafieldDefinition(admin);
  await syncBundleProductMetafields(admin, result.product.id, [productA.id, productB.id]);

  return mapProduct(result.product);
}
