import { data, redirect, Form, useActionData, useLoaderData } from "react-router";
import {
  listBundleCards,
  pushBundleToProducts,
  removeBundle,
} from "../modules/bundles/bundle.service.server.js";
import { toAdminProductUrl } from "../modules/shopify/product-links.js";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const bundles = await listBundleCards({ admin, shop: session.shop });

  return data({ bundles, shop: session.shop });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const bundleId = String(formData.get("bundleId") ?? "");

  if (intent === "delete") {
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

  return data({ error: "Unsupported action." }, { status: 400 });
};

function renderBundleProduct(bundle, shop) {
  if (!bundle.bundleProduct) {
    return <span style={styles.mutedText}>Not pushed</span>;
  }

  const productUrl = toAdminProductUrl(shop, bundle.bundleProduct.id);

  return (
    <div style={styles.productCell}>
      <div>{bundle.bundleProduct.title}</div>
      <div style={styles.bundleMeta}>
        Status: {String(bundle.bundleProduct.status ?? "unknown").toLowerCase()}
      </div>
      {productUrl ? (
        <a href={productUrl} target="_top" rel="noreferrer" style={styles.inlineLink}>
          View in Products
        </a>
      ) : null}
    </div>
  );
}

export default function BundleListPage() {
  const { bundles, shop } = useLoaderData();
  const actionData = useActionData();

  return (
    <s-page heading="Bundles" subheading="Two-product bundles powered by existing Shopify products">
      <s-section slot="aside">
        <a href="/app/bundles/new" style={styles.primaryLink}>
          Create bundle
        </a>
      </s-section>
      {actionData?.error ? <div style={styles.error}>{actionData.error}</div> : null}
      {actionData?.success ? <div style={styles.success}>{actionData.success}</div> : null}
      {bundles.length ? (
        <s-section heading="Bundle list">
          <table style={styles.table}>
            <thead>
              <tr>
                <th align="left">Bundle</th>
                <th align="left">Product A</th>
                <th align="left">Product B</th>
                <th align="left">Pushed product</th>
                <th align="left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((bundle) => (
                <tr key={bundle.id} style={styles.row}>
                  <td style={styles.bundleCell}>
                    <div style={styles.bundleName}>{bundle.name}</div>
                    <div style={styles.bundleMeta}>
                      Updated {new Date(bundle.updatedAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>{bundle.productA?.title ?? "Product removed"}</td>
                  <td>{bundle.productB?.title ?? "Product removed"}</td>
                  <td>{renderBundleProduct(bundle, shop)}</td>
                  <td>
                    <div style={styles.actions}>
                      <s-link href={`/app/bundles/${bundle.id}`}>Edit</s-link>
                      <Form method="post">
                        <input type="hidden" name="intent" value="push" />
                        <input type="hidden" name="bundleId" value={bundle.id} />
                        <button type="submit" style={styles.secondaryButton}>
                          {bundle.bundleProduct ? "Sync product" : "Push to products"}
                        </button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="bundleId" value={bundle.id} />
                        <button type="submit" style={styles.deleteButton}>
                          Delete
                        </button>
                      </Form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </s-section>
      ) : (
        <s-section heading="No bundles yet">
          <s-paragraph>
            Create your first bundle by selecting two existing Shopify products. Then use
            Push to products to create the matching Shopify product entry.
          </s-paragraph>
        </s-section>
      )}
    </s-page>
  );
}

const styles = {
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "999px",
    background: "#111827",
    color: "#fff",
    padding: "0.75rem 1.25rem",
    textDecoration: "none",
    fontWeight: 600,
  },
  success: {
    marginBottom: "1rem",
    color: "#166534",
  },
  error: {
    marginBottom: "1rem",
    color: "#8b1e1e",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  row: {
    borderTop: "1px solid #d9d9d9",
  },
  bundleCell: {
    padding: "0.75rem 0",
  },
  productCell: {
    display: "grid",
    gap: "0.25rem",
    padding: "0.75rem 0",
  },
  bundleName: {
    fontWeight: 600,
  },
  bundleMeta: {
    color: "#666",
  },
  mutedText: {
    color: "#666",
  },
  inlineLink: {
    color: "#0f766e",
    textDecoration: "none",
  },
  actions: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    flexWrap: "wrap",
  },
  secondaryButton: {
    border: "1px solid #d1d5db",
    borderRadius: "999px",
    background: "#fff",
    color: "#111827",
    cursor: "pointer",
    padding: "0.5rem 0.9rem",
    font: "inherit",
  },
  deleteButton: {
    border: 0,
    background: "transparent",
    color: "#8b1e1e",
    cursor: "pointer",
    padding: 0,
    font: "inherit",
  },
};
