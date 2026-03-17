import { toAdminProductUrl } from "../../shopify/product-links.js";

export function getCreateTitleError(actionData) {
  return actionData?.error === "Bundle name is required." ? "Add title" : null;
}

export function getCreateProductError(actionData) {
  if (
    actionData?.error === "Select Product A and Product B." ||
    actionData?.error === "One or both selected products could not be found in Shopify."
  ) {
    return actionData.error;
  }

  return null;
}

export function mergeUniqueProducts(primaryProducts, secondaryProducts = []) {
  const seenIds = new Set();

  return [...secondaryProducts, ...primaryProducts].filter((product) => {
    if (!product?.id || seenIds.has(product.id)) {
      return false;
    }

    seenIds.add(product.id);
    return true;
  });
}

export function getBundleProducts(productA, productB) {
  return [productA, productB].filter(Boolean);
}

export function getProductOptionGroups(products, shop) {
  return products.flatMap((product) => {
    const productUrl = toAdminProductUrl(shop, product.id);

    return (product.options ?? []).map((option) => ({
      key: `${product.id}-${option.id ?? option.name}`,
      productId: product.id,
      productTitle: product.title,
      productUrl,
      optionName: option.name,
      values: option.values ?? [],
    }));
  });
}

export function normalizeOptionName(optionName) {
  return String(optionName ?? "").trim().toLowerCase();
}

export function normalizeOptionValue(optionValue) {
  return String(optionValue ?? "").trim().toLowerCase();
}

export function getOptionValueKey(productId, optionName, optionValue) {
  return `${productId}::${normalizeOptionName(optionName)}::${normalizeOptionValue(
    optionValue,
  )}`;
}

export function getMatchingOptionValueKeys(optionGroups, optionName, optionValue) {
  const normalizedOptionName = normalizeOptionName(optionName);
  const normalizedOptionValue = normalizeOptionValue(optionValue);

  return optionGroups.flatMap((optionGroup) => {
    if (normalizeOptionName(optionGroup.optionName) !== normalizedOptionName) {
      return [];
    }

    return (optionGroup.values ?? [])
      .filter((value) => normalizeOptionValue(value) === normalizedOptionValue)
      .map((value) =>
        getOptionValueKey(optionGroup.productId, optionGroup.optionName, value),
      );
  });
}

export function getCombinedOptionGroups(optionGroups) {
  const groupedOptions = new Map();

  for (const optionGroup of optionGroups) {
    const normalizedName = normalizeOptionName(optionGroup.optionName);
    const existingGroup = groupedOptions.get(normalizedName);

    if (!existingGroup) {
      groupedOptions.set(normalizedName, {
        key: `combined-${normalizedName}`,
        optionName: optionGroup.optionName,
        productTitles: [optionGroup.productTitle],
        values: [...(optionGroup.values ?? [])],
      });
      continue;
    }

    if (!existingGroup.productTitles.includes(optionGroup.productTitle)) {
      existingGroup.productTitles.push(optionGroup.productTitle);
    }

    const seenValues = new Set(
      existingGroup.values.map((value) => String(value).trim().toLowerCase()),
    );

    for (const value of optionGroup.values ?? []) {
      const normalizedValue = String(value).trim().toLowerCase();

      if (!seenValues.has(normalizedValue)) {
        seenValues.add(normalizedValue);
        existingGroup.values.push(value);
      }
    }
  }

  return [...groupedOptions.values()];
}

export function getProductVariantCombinationCount(product, disabledOptionValueKeySet) {
  const productOptions = product.options ?? [];

  if (!productOptions.length) {
    return 1;
  }

  return productOptions.reduce((total, option) => {
    const enabledValueCount = (option.values ?? []).filter((value) => {
      return !disabledOptionValueKeySet.has(
        getOptionValueKey(product.id, option.name, value),
      );
    }).length;

    return total * enabledValueCount;
  }, 1);
}

export function getVariantCombinationCount(products, disabledOptionValueKeySet) {
  if (products.length !== 2) {
    return 0;
  }

  return products.reduce((total, product) => {
    return total * getProductVariantCombinationCount(product, disabledOptionValueKeySet);
  }, 1);
}

export function filterAvailableDisabledOptionValueKeys(products, shop, currentKeys) {
  const availableOptionValueKeys = new Set(
    getProductOptionGroups(getBundleProducts(products[0], products[1]), shop).flatMap(
      (optionGroup) =>
        (optionGroup.values ?? []).map((value) =>
          getOptionValueKey(optionGroup.productId, optionGroup.optionName, value),
        ),
    ),
  );

  return currentKeys.filter((currentKey) => availableOptionValueKeys.has(currentKey));
}
