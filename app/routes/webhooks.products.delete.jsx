import { removeBundlesForDeletedProduct } from "../modules/bundles/bundle.service.server.js";
import { authenticate } from "../shopify.server";

function toProductGid(id) {
  return `gid://shopify/Product/${id}`;
}

export const action = async ({ request }) => {
  const { payload, shop, topic } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  await removeBundlesForDeletedProduct({
    shop,
    productId: toProductGid(payload.id),
  });

  return new Response();
};

