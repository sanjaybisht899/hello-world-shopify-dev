import { useActionData, useLoaderData, useNavigation } from "react-router";
import { BundleProductScreen } from "../modules/bundle-product/screen.jsx";
import {
  loadBundleProductPage,
  submitBundleProductPage,
} from "../modules/bundle-product/page.server.js";
import { authenticate } from "../shopify.server";

export const loader = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);

  return loadBundleProductPage({
    request,
    admin,
    bundleId: params.bundleId,
    shop: session.shop,
  });
};

export const action = async ({ request, params }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();

  return submitBundleProductPage({
    admin,
    bundleId: params.bundleId,
    formData,
    shop: session.shop,
  });
};

export default function BundleProductPageRoute() {
  const loaderData = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  return (
    <BundleProductScreen
      {...loaderData}
      actionData={actionData}
      isSubmitting={navigation.state === "submitting"}
    />
  );
}
