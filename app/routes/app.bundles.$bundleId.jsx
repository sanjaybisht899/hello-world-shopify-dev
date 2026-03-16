import { useEffect, useState } from "react";
import {
  Form,
  data,
  redirect,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
} from "react-router";
import {
  getBundleEditorData,
  getProductPickerDefaults,
  pushBundleToProducts,
  saveBundle,
} from "../modules/bundles/bundle.service.server.js";
import { toAdminProductUrl } from "../modules/shopify/product-links.js";
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

    return redirect(`/app/bundles/${bundle.id}`);
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

function ProductPicker({
  label,
  query,
  setQuery,
  selectedProduct,
  setSelectedProduct,
  defaultProducts,
  blockedProductId,
}) {
  const fetcher = useFetcher();

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      return;
    }

    fetcher.load(`/app/products/search?q=${encodeURIComponent(normalizedQuery)}`);
  }, [fetcher, query]);

  const results = (
    query.trim().length >= 2 ? fetcher.data?.products ?? [] : defaultProducts
  ).filter((product) => product.id !== blockedProductId);

  return (
    <div style={styles.picker}>
      <label style={styles.label}>{label}</label>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Shopify products"
        style={styles.input}
      />
      <div style={styles.helperText}>
        {query.trim().length >= 2
          ? "Choose one result below."
          : "Type at least 2 characters or pick from the suggested products."}
      </div>
      {selectedProduct ? (
        <div style={styles.selectionCard}>
          <div style={styles.selectionTitle}>{selectedProduct.title}</div>
          <div style={styles.selectionMeta}>
            {selectedProduct.variants.length} variant previews loaded
          </div>
        </div>
      ) : null}
      <div style={styles.resultsList}>
        {results.length ? (
          results.map((product) => {
            const isSelected = selectedProduct?.id === product.id;

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => {
                  setSelectedProduct(product);
                  setQuery(product.title);
                }}
                style={{
                  ...styles.resultButton,
                  ...(isSelected ? styles.resultButtonActive : {}),
                }}
              >
                <span>{product.title}</span>
                <span style={styles.resultMeta}>{product.status}</span>
              </button>
            );
          })
        ) : (
          <div style={styles.emptyState}>No products matched this search.</div>
        )}
      </div>
    </div>
  );
}

export default function BundleEditorPage() {
  const { bundle, defaultProducts, shop } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const [selectedProductA, setSelectedProductA] = useState(bundle?.productA ?? null);
  const [selectedProductB, setSelectedProductB] = useState(bundle?.productB ?? null);
  const [queryA, setQueryA] = useState(bundle?.productA?.title ?? "");
  const [queryB, setQueryB] = useState(bundle?.productB?.title ?? "");

  useEffect(() => {
    setSelectedProductA(bundle?.productA ?? null);
    setSelectedProductB(bundle?.productB ?? null);
    setQueryA(bundle?.productA?.title ?? "");
    setQueryB(bundle?.productB?.title ?? "");
  }, [bundle]);

  const isSubmitting = navigation.state === "submitting";
  const heading = bundle ? `Edit ${bundle.name}` : "Create bundle";
  const nameDefaultValue = actionData?.values?.name ?? bundle?.name ?? "";
  const productUrl = toAdminProductUrl(shop, bundle?.bundleProduct?.id);

  return (
    <s-page heading={heading} subheading="Each bundle links exactly two Shopify products.">
      <s-section>
        {actionData?.error ? <div style={styles.error}>{actionData.error}</div> : null}
        {actionData?.success ? <div style={styles.success}>{actionData.success}</div> : null}
        <Form method="post">
          <div style={styles.formLayout}>
            <label style={styles.label}>
              Bundle name
              <input
                type="text"
                name="name"
                defaultValue={nameDefaultValue}
                placeholder="Tshirt + Hoodie Bundle"
                style={styles.input}
                required
              />
            </label>
            <ProductPicker
              label="Product A"
              query={queryA}
              setQuery={setQueryA}
              selectedProduct={selectedProductA}
              setSelectedProduct={setSelectedProductA}
              defaultProducts={defaultProducts}
              blockedProductId={selectedProductB?.id}
            />
            <ProductPicker
              label="Product B"
              query={queryB}
              setQuery={setQueryB}
              selectedProduct={selectedProductB}
              setSelectedProduct={setSelectedProductB}
              defaultProducts={defaultProducts}
              blockedProductId={selectedProductA?.id}
            />
          </div>
          <input type="hidden" name="productAId" value={selectedProductA?.id ?? ""} />
          <input type="hidden" name="productBId" value={selectedProductB?.id ?? ""} />
          <div style={styles.actionsRow}>
            <button
              type="submit"
              name="intent"
              value="save"
              style={styles.primaryButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save bundle"}
            </button>
            <s-link href="/app">Back to bundles</s-link>
          </div>
        </Form>
      </s-section>
      {bundle ? (
        <s-section heading="Push to products">
          <s-paragraph>
            Create or sync a Shopify product so this bundle appears in the Products
            section of Shopify Admin.
          </s-paragraph>
          {bundle.bundleProduct ? (
            <div style={styles.pushDetails}>
              <div style={styles.selectionTitle}>{bundle.bundleProduct.title}</div>
              <div style={styles.selectionMeta}>
                Status: {String(bundle.bundleProduct.status ?? "unknown").toLowerCase()}
              </div>
              {productUrl ? (
                <a href={productUrl} target="_top" rel="noreferrer" style={styles.inlineLink}>
                  View in Products
                </a>
              ) : null}
            </div>
          ) : (
            <div style={styles.helperText}>
              This bundle has not been pushed to Shopify Products yet.
            </div>
          )}
          <Form method="post">
            <input type="hidden" name="intent" value="push" />
            <button type="submit" style={styles.secondaryButton} disabled={isSubmitting}>
              {bundle.bundleProduct ? "Sync product" : "Push to products"}
            </button>
          </Form>
        </s-section>
      ) : null}
      <s-section slot="aside" heading="Variant behavior">
        <s-paragraph>
          The app stores only the two Shopify product IDs. Variant choices happen on the
          storefront, so bundle pricing stays dynamic and uses the current Shopify variant
          prices.
        </s-paragraph>
        <s-paragraph>
          Inventory stays native to Shopify because checkout adds the selected variants as
          two separate line items.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

const styles = {
  formLayout: {
    display: "grid",
    gap: "1rem",
  },
  picker: {
    border: "1px solid #d9d9d9",
    borderRadius: "0.75rem",
    padding: "1rem",
    display: "grid",
    gap: "0.75rem",
  },
  label: {
    display: "grid",
    gap: "0.5rem",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    border: "1px solid #c7c7c7",
    borderRadius: "0.5rem",
    padding: "0.75rem",
    font: "inherit",
  },
  helperText: {
    color: "#666",
    fontSize: "0.9rem",
  },
  error: {
    marginBottom: "1rem",
    color: "#8b1e1e",
  },
  success: {
    marginBottom: "1rem",
    color: "#166534",
  },
  resultsList: {
    display: "grid",
    gap: "0.5rem",
    maxHeight: "15rem",
    overflowY: "auto",
  },
  resultButton: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #d9d9d9",
    borderRadius: "0.75rem",
    background: "#fff",
    padding: "0.75rem",
    cursor: "pointer",
    font: "inherit",
    textAlign: "left",
  },
  resultButtonActive: {
    borderColor: "#111827",
    background: "#f3f4f6",
  },
  resultMeta: {
    color: "#666",
    textTransform: "capitalize",
    fontSize: "0.85rem",
  },
  selectionCard: {
    background: "#f7f7f7",
    borderRadius: "0.75rem",
    padding: "0.75rem",
  },
  selectionTitle: {
    fontWeight: 600,
  },
  selectionMeta: {
    color: "#666",
    fontSize: "0.9rem",
  },
  emptyState: {
    color: "#666",
    padding: "0.5rem 0",
  },
  actionsRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "center",
    marginTop: "1rem",
  },
  primaryButton: {
    border: 0,
    borderRadius: "999px",
    background: "#111827",
    color: "#fff",
    padding: "0.75rem 1.25rem",
    cursor: "pointer",
    font: "inherit",
  },
  secondaryButton: {
    marginTop: "1rem",
    border: "1px solid #d1d5db",
    borderRadius: "999px",
    background: "#fff",
    color: "#111827",
    padding: "0.75rem 1.25rem",
    cursor: "pointer",
    font: "inherit",
  },
  pushDetails: {
    marginTop: "1rem",
    display: "grid",
    gap: "0.35rem",
  },
  inlineLink: {
    color: "#0f766e",
    textDecoration: "none",
  },
};
