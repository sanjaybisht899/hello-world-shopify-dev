import {
  clearBundleProductIdByProductId,
  createBundle,
  deleteBundle,
  deleteBundlesByProductId,
  getBundleById,
  listBundlesByShop,
  setBundleProductId,
  updateBundle,
} from "./bundle.repository.server.js";
import {
  getProductsByIds,
  pushBundleProductToShopify,
  searchProducts,
} from "../shopify/products.server.js";

function validateBundleInput({ name, productAId, productBId }) {
  const normalizedName = name?.trim();

  if (!normalizedName) {
    throw new Error("Bundle name is required.");
  }

  if (!productAId || !productBId) {
    throw new Error("Select Product A and Product B.");
  }

  if (productAId === productBId) {
    throw new Error("Product A and Product B must be different products.");
  }

  return {
    name: normalizedName,
    productAId,
    productBId,
  };
}

function getBundleProductIds(bundle) {
  return [bundle.productAId, bundle.productBId, bundle.bundleProductId].filter(Boolean);
}

function hydrateBundle(bundle, productMap) {
  return {
    id: bundle.id,
    name: bundle.name,
    createdAt: bundle.createdAt,
    updatedAt: bundle.updatedAt,
    productA: productMap.get(bundle.productAId) ?? null,
    productB: productMap.get(bundle.productBId) ?? null,
    bundleProduct: bundle.bundleProductId
      ? productMap.get(bundle.bundleProductId) ?? null
      : null,
  };
}

export async function listBundleCards({ admin, shop }) {
  const bundles = await listBundlesByShop(shop);
  const productIds = [
    ...new Set(bundles.flatMap((bundle) => getBundleProductIds(bundle))),
  ];
  const products = await getProductsByIds(admin, productIds);
  const productMap = new Map(products.map((product) => [product.id, product]));

  return bundles.map((bundle) => hydrateBundle(bundle, productMap));
}

export async function getBundleEditorData({ admin, shop, bundleId }) {
  const bundle = await getBundleById(bundleId, shop);

  if (!bundle) {
    throw new Response("Bundle not found", { status: 404 });
  }

  const products = await getProductsByIds(admin, getBundleProductIds(bundle));
  const productMap = new Map(products.map((product) => [product.id, product]));

  return hydrateBundle(bundle, productMap);
}

export async function saveBundle({ admin, shop, bundleId, values }) {
  const payload = validateBundleInput(values);
  const products = await getProductsByIds(admin, [
    payload.productAId,
    payload.productBId,
  ]);

  if (products.length !== 2) {
    throw new Error("One or both selected products could not be found in Shopify.");
  }

  if (bundleId) {
    const existingBundle = await getBundleById(bundleId, shop);

    if (!existingBundle) {
      throw new Error("Bundle not found.");
    }

    return updateBundle(bundleId, shop, payload);
  }

  return createBundle({
    ...payload,
    shop,
  });
}

export async function pushBundleToProducts({ admin, shop, bundleId }) {
  const bundle = await getBundleById(bundleId, shop);

  if (!bundle) {
    throw new Error("Bundle not found.");
  }

  const products = await getProductsByIds(admin, getBundleProductIds(bundle));
  const productMap = new Map(products.map((product) => [product.id, product]));
  const productA = productMap.get(bundle.productAId);
  const productB = productMap.get(bundle.productBId);
  const existingBundleProductId = productMap.get(bundle.bundleProductId)?.id ?? null;

  if (!productA || !productB) {
    throw new Error("One or both linked products could not be found in Shopify.");
  }

  const pushedProduct = await pushBundleProductToShopify(admin, {
    bundle,
    existingBundleProductId,
    productA,
    productB,
  });

  const persistedBundle = await setBundleProductId(bundle.id, shop, pushedProduct.id);
  productMap.set(pushedProduct.id, pushedProduct);

  return hydrateBundle(persistedBundle, productMap);
}

export async function removeBundle({ bundleId, shop }) {
  const result = await deleteBundle(bundleId, shop);

  if (!result.count) {
    throw new Error("Bundle not found.");
  }
}

export function getProductPickerDefaults(admin) {
  return searchProducts(admin, "", 8);
}

export function searchBundleProducts(admin, searchTerm) {
  return searchProducts(admin, searchTerm, 12);
}

export async function removeBundlesForDeletedProduct({ shop, productId }) {
  await Promise.all([
    deleteBundlesByProductId(shop, productId),
    clearBundleProductIdByProductId(shop, productId),
  ]);
}
