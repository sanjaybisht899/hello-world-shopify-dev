import { data } from "react-router";
import { searchBundleProducts } from "../modules/bundles/bundle.service.server.js";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const products = await searchBundleProducts(admin, query);

  return data({ products });
};

