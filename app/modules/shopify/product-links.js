export function toAdminProductUrl(shop, productId) {
  if (!shop || !productId) {
    return null;
  }

  const numericId = String(productId).split("/").pop();

  if (!numericId) {
    return null;
  }

  return `https://${shop}/admin/products/${numericId}`;
}
