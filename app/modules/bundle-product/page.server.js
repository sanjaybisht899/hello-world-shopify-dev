import { data, redirect } from "react-router";
import {
  getBundleEditorData,
  pushBundleToProducts,
} from "../bundles/bundle.service.server.js";
import { toAdminProductUrl } from "../shopify/product-links.js";
import {
  getBundleProductFormValues,
  getProductPageDefaults,
  parseTags,
  toDescriptionHtml,
} from "./helpers.js";

const SHOP_NAME_QUERY = `#graphql
  query BundleProductPageShop {
    shop {
      name
    }
  }
`;

async function getShopName(admin) {
  const response = await admin.graphql(SHOP_NAME_QUERY);
  const payload = await response.json();

  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  return payload.data?.shop?.name ?? "";
}

export async function loadBundleProductPage({ request, admin, bundleId, shop }) {
  const url = new URL(request.url);
  const [bundle, shopName] = await Promise.all([
    getBundleEditorData({
      admin,
      shop,
      bundleId,
    }),
    getShopName(admin),
  ]);

  return data({
    bundle,
    bundleProductUrl: toAdminProductUrl(shop, bundle.bundleProduct?.id),
    defaults: getProductPageDefaults(bundle, shopName),
    saved: url.searchParams.get("saved") === "1",
  });
}

export async function submitBundleProductPage({ admin, bundleId, formData, shop }) {
  const values = getBundleProductFormValues(formData);

  try {
    const bundle = await pushBundleToProducts({
      admin,
      shop,
      bundleId,
      productOverrides: {
        title: values.title,
        descriptionHtml: toDescriptionHtml(values.description),
        productType: values.productType,
        vendor: values.vendor,
        tags: parseTags(values.tags),
        status: values.status,
      },
    });

    return redirect(`/app/bundle-product/${bundle.id}?saved=1`);
  } catch (error) {
    return data(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save the bundle product.",
        values,
      },
      { status: 400 },
    );
  }
}
