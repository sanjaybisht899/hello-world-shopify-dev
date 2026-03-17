import {
  data,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "react-router";
import {
  getBundleEditorData,
  getProductPickerDefaults,
  pushBundleToProducts,
  removeBundle,
  saveBundle,
} from "../modules/bundles/bundle.service.server.js";
import { BundleEditorScreen } from "../modules/bundles/editor/screen.jsx";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const bundleId = params.bundleId === "new" ? null : params.bundleId;

  const [defaultProducts, bundle] = await Promise.all([
    getProductPickerDefaults(admin),
    bundleId
      ? getBundleEditorData({ admin, shop: session.shop, bundleId })
      : Promise.resolve(null),
  ]);

  return data({ bundle, defaultProducts, shop: session.shop });
};

export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const bundleId = params.bundleId === "new" ? null : params.bundleId;
  const intent = String(formData.get("intent") ?? "save");

  if (intent === "delete") {
    if (!bundleId) {
      return data({ error: "Bundle not found." }, { status: 404 });
    }

    try {
      await removeBundle({
        bundleId,
        shop: session.shop,
      });

      return redirect("/app");
    } catch (error) {
      return data(
        {
          error: error instanceof Error ? error.message : "Unable to delete bundle.",
        },
        { status: 400 },
      );
    }
  }

  if (intent === "push") {
    if (!bundleId) {
      return data(
        { error: "Save the bundle before pushing it to Shopify Products." },
        { status: 400 },
      );
    }

    try {
      const bundle = await pushBundleToProducts({
        admin,
        shop: session.shop,
        bundleId,
      });

      return data({ success: `${bundle.name} was pushed to Shopify Products.` });
    } catch (error) {
      return data(
        {
          error:
            error instanceof Error
              ? error.message
              : "Unable to push this bundle to Shopify Products.",
        },
        { status: 400 },
      );
    }
  }

  if (intent !== "save") {
    return data({ error: "Unsupported action." }, { status: 400 });
  }

  const redirectTo = String(formData.get("redirectTo") ?? "");
  const values = {
    name: String(formData.get("name") ?? ""),
    productAId: String(formData.get("productAId") ?? ""),
    productBId: String(formData.get("productBId") ?? ""),
  };

  try {
    const bundle = await saveBundle({
      admin,
      shop: session.shop,
      bundleId,
      values,
    });

    return redirect(
      redirectTo === "product-page"
        ? `/app/bundle-product/${bundle.id}`
        : `/app/bundles/${bundle.id}`,
    );
  } catch (error) {
    return data(
      {
        error: error instanceof Error ? error.message : "Unable to save bundle.",
        values,
      },
      { status: 400 },
    );
  }
};

export default function BundleEditorPage() {
  const { bundle, defaultProducts, shop } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  return (
    <BundleEditorScreen
      bundle={bundle}
      defaultProducts={defaultProducts}
      shop={shop}
      actionData={actionData}
      isSubmitting={navigation.state === "submitting"}
    />
  );
}
