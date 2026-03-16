import { randomUUID } from "node:crypto";
import db from "../../db.server.js";

function mapBundleRow(bundle) {
  return bundle
    ? {
        ...bundle,
        bundleProductId: bundle.bundleProductId ?? null,
      }
    : null;
}

export async function listBundlesByShop(shop) {
  const rows = await db.$queryRaw`
    SELECT id, shop, name, productAId, productBId, bundleProductId, createdAt, updatedAt
    FROM Bundle
    WHERE shop = ${shop}
    ORDER BY createdAt DESC
  `;

  return rows.map(mapBundleRow);
}

export async function getBundleById(id, shop) {
  const rows = await db.$queryRaw`
    SELECT id, shop, name, productAId, productBId, bundleProductId, createdAt, updatedAt
    FROM Bundle
    WHERE id = ${id} AND shop = ${shop}
    LIMIT 1
  `;

  return mapBundleRow(rows[0] ?? null);
}

export async function createBundle(data) {
  const bundle = {
    id: randomUUID(),
    shop: data.shop,
    name: data.name,
    productAId: data.productAId,
    productBId: data.productBId,
    bundleProductId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.$executeRaw`
    INSERT INTO Bundle (id, shop, name, productAId, productBId, bundleProductId, createdAt, updatedAt)
    VALUES (${bundle.id}, ${bundle.shop}, ${bundle.name}, ${bundle.productAId}, ${bundle.productBId}, ${bundle.bundleProductId}, ${bundle.createdAt}, ${bundle.updatedAt})
  `;

  return bundle;
}

export async function updateBundle(id, shop, data) {
  const updatedAt = new Date().toISOString();

  await db.$executeRaw`
    UPDATE Bundle
    SET name = ${data.name},
        productAId = ${data.productAId},
        productBId = ${data.productBId},
        updatedAt = ${updatedAt}
    WHERE id = ${id} AND shop = ${shop}
  `;

  return getBundleById(id, shop);
}

export async function setBundleProductId(id, shop, bundleProductId) {
  const updatedAt = new Date().toISOString();

  await db.$executeRaw`
    UPDATE Bundle
    SET bundleProductId = ${bundleProductId},
        updatedAt = ${updatedAt}
    WHERE id = ${id} AND shop = ${shop}
  `;

  return getBundleById(id, shop);
}

export async function clearBundleProductIdByProductId(shop, productId) {
  const updatedAt = new Date().toISOString();
  const count = await db.$executeRaw`
    UPDATE Bundle
    SET bundleProductId = NULL,
        updatedAt = ${updatedAt}
    WHERE shop = ${shop} AND bundleProductId = ${productId}
  `;

  return { count };
}

export async function deleteBundle(id, shop) {
  const count = await db.$executeRaw`
    DELETE FROM Bundle
    WHERE id = ${id} AND shop = ${shop}
  `;

  return { count };
}

export function deleteBundlesByProductId(shop, productId) {
  return db.$executeRaw`
    DELETE FROM Bundle
    WHERE shop = ${shop}
      AND (productAId = ${productId} OR productBId = ${productId})
  `;
}
