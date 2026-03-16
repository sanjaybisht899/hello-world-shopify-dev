import { useEffect, useState } from "react";
import {
  Form,
  Link,
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
  removeBundle,
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

function BackArrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={createStyles.backIcon} aria-hidden="true">
      <path
        d="M11.5 4.5L6 10l5.5 5.5M6.8 10h8.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CreateBundleIllustration() {
  return (
    <svg viewBox="0 0 220 180" fill="none" style={createStyles.illustration} aria-hidden="true">
      <circle cx="110" cy="82" r="48" fill="#f1f2f4" />
      <rect x="83" y="28" width="54" height="88" rx="8" fill="#ffffff" stroke="#d9dce1" />
      <rect x="92" y="40" width="17" height="17" rx="3" fill="#ffffff" stroke="#d9dce1" />
      <path d="M100 43l5 12c.4 1-.3 2-1.4 2h-7.2c-1.1 0-1.8-1-1.4-2l5-12z" fill="#f4b13d" />
      <rect x="116" y="54" width="20" height="20" rx="3" fill="#ffffff" stroke="#d9dce1" />
      <path d="M123 58h8l-1.4 2.6V70h-5.2v-9.4L123 58z" fill="#e46a5a" />
      <path d="M121.5 58.5l2.4 2.2h6.2l2.4-2.2" stroke="#e46a5a" strokeWidth="1.2" strokeLinecap="round" />
      <rect x="133" y="66" width="18" height="18" rx="3" fill="#ffffff" stroke="#d9dce1" />
      <path d="M145 72.5c0-2.8-1.9-4.8-4.6-4.8s-4.6 2-4.6 4.8c0 4.6 4.6 8.6 4.6 8.6s4.6-4 4.6-8.6z" fill="#59a8b6" />
      <path d="M144.5 71h3" stroke="#59a8b6" strokeWidth="1.3" strokeLinecap="round" />
      <rect x="93" y="96" width="31" height="4" rx="2" fill="#d9dce1" />
      <rect x="93" y="104" width="19" height="4" rx="2" fill="#d9dce1" />
      <rect x="94" y="111" width="27" height="8" rx="4" fill="#14a37f" />
    </svg>
  );
}

function getCreateTitleError(actionData) {
  return actionData?.error === "Bundle name is required." ? "Add title" : null;
}

function getCreateProductError(actionData) {
  if (
    actionData?.error === "Select Product A and Product B." ||
    actionData?.error === "One or both selected products could not be found in Shopify."
  ) {
    return actionData.error;
  }

  return null;
}

function CreateBundlePage({
  actionData,
  defaultProducts,
  isSubmitting,
  queryA,
  queryB,
  selectedProductA,
  selectedProductB,
  setQueryA,
  setQueryB,
  setSelectedProductA,
  setSelectedProductB,
  showProductSelectors,
  setShowProductSelectors,
}) {
  const titleError = getCreateTitleError(actionData);
  const productError = getCreateProductError(actionData);
  const generalError =
    actionData?.error && !titleError && !productError ? actionData.error : null;
  const selectedCount = [selectedProductA, selectedProductB].filter(Boolean).length;

  return (
    <div style={createStyles.page}>
      <div style={createStyles.container}>
        <div style={createStyles.headingRow}>
          <Link to="/app" style={createStyles.backLink}>
            <BackArrow />
            <span>Create bundle</span>
          </Link>
        </div>

        {generalError ? <div style={createStyles.generalError}>{generalError}</div> : null}

        <Form method="post">
          <div style={createStyles.layout}>
            <div style={createStyles.mainColumn}>
              <section style={createStyles.card}>
                <label style={createStyles.fieldLabel}>Title</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={actionData?.values?.name ?? ""}
                  placeholder="T-Shirt Bundle"
                  style={{
                    ...createStyles.titleInput,
                    ...(titleError ? createStyles.titleInputError : {}),
                  }}
                />
                {titleError ? (
                  <div style={createStyles.fieldError}>
                    <span style={createStyles.fieldErrorIcon}>!</span>
                    <span>{titleError}</span>
                  </div>
                ) : null}
              </section>

              <section style={{ ...createStyles.card, ...createStyles.productsCard }}>
                {showProductSelectors ? (
                  <div style={createStyles.productSelectorArea}>
                    <div style={createStyles.productsSummary}>
                      <div style={createStyles.productsSummaryTitle}>Bundle products</div>
                      <button
                        type="button"
                        onClick={() => setShowProductSelectors(false)}
                        style={createStyles.secondaryTextButton}
                      >
                        Hide selectors
                      </button>
                    </div>
                    {productError ? (
                      <div style={createStyles.productError}>{productError}</div>
                    ) : null}
                    <div style={createStyles.productPickerGrid}>
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
                  </div>
                ) : (
                  <div style={createStyles.emptyProductsState}>
                    <CreateBundleIllustration />
                    <div style={createStyles.emptyProductsTitle}>
                      Select the products you want to bundle.
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowProductSelectors(true)}
                      style={createStyles.selectProductsButton}
                    >
                      Select products
                    </button>
                    {productError ? (
                      <div style={createStyles.productError}>{productError}</div>
                    ) : null}
                  </div>
                )}
                <input type="hidden" name="productAId" value={selectedProductA?.id ?? ""} />
                <input type="hidden" name="productBId" value={selectedProductB?.id ?? ""} />
              </section>
            </div>

            <aside style={createStyles.sideCard}>
              <div style={createStyles.sideTitle}>Components</div>
              <p style={createStyles.sideText}>
                Bundles include exactly two Shopify products. Variant selection and pricing
                still come from the original Shopify products.
              </p>
              <ul style={createStyles.sideList}>
                <li>{selectedCount}/2 bundled products</li>
                <li>0/4 options</li>
                <li>0/10000 variants</li>
              </ul>
              <button
                type="submit"
                name="intent"
                value="save"
                style={createStyles.saveButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save and continue"}
              </button>
            </aside>
          </div>
        </Form>
      </div>
    </div>
  );
}

function EditBundlePage({
  actionData,
  bundle,
  defaultProducts,
  isSubmitting,
  queryA,
  queryB,
  selectedProductA,
  selectedProductB,
  setQueryA,
  setQueryB,
  setSelectedProductA,
  setSelectedProductB,
  shop,
}) {
  const productUrl = toAdminProductUrl(shop, bundle?.bundleProduct?.id);
  const nameDefaultValue = actionData?.values?.name ?? bundle?.name ?? "";

  return (
    <s-page heading={`Edit ${bundle.name}`} subheading="Each bundle links exactly two Shopify products.">
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
            <Link to="/app" style={styles.backLink}>Back to bundles</Link>
          </div>
        </Form>
      </s-section>
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
        <div style={styles.pushActions}>
          <Form method="post">
            <input type="hidden" name="intent" value="push" />
            <button type="submit" style={styles.secondaryButton} disabled={isSubmitting}>
              {bundle.bundleProduct ? "Sync product" : "Push to products"}
            </button>
          </Form>
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <button type="submit" style={styles.deleteButton} disabled={isSubmitting}>
              Delete bundle
            </button>
          </Form>
        </div>
      </s-section>
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

export default function BundleEditorPage() {
  const { bundle, defaultProducts, shop } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();

  const [selectedProductA, setSelectedProductA] = useState(bundle?.productA ?? null);
  const [selectedProductB, setSelectedProductB] = useState(bundle?.productB ?? null);
  const [queryA, setQueryA] = useState(bundle?.productA?.title ?? "");
  const [queryB, setQueryB] = useState(bundle?.productB?.title ?? "");
  const [showProductSelectors, setShowProductSelectors] = useState(
    Boolean(bundle?.productA || bundle?.productB),
  );

  useEffect(() => {
    setSelectedProductA(bundle?.productA ?? null);
    setSelectedProductB(bundle?.productB ?? null);
    setQueryA(bundle?.productA?.title ?? "");
    setQueryB(bundle?.productB?.title ?? "");
    setShowProductSelectors(Boolean(bundle?.productA || bundle?.productB));
  }, [bundle]);

  useEffect(() => {
    if (getCreateProductError(actionData)) {
      setShowProductSelectors(true);
    }
  }, [actionData]);

  const isSubmitting = navigation.state === "submitting";

  if (!bundle) {
    return (
      <CreateBundlePage
        actionData={actionData}
        defaultProducts={defaultProducts}
        isSubmitting={isSubmitting}
        queryA={queryA}
        queryB={queryB}
        selectedProductA={selectedProductA}
        selectedProductB={selectedProductB}
        setQueryA={setQueryA}
        setQueryB={setQueryB}
        setSelectedProductA={setSelectedProductA}
        setSelectedProductB={setSelectedProductB}
        showProductSelectors={showProductSelectors}
        setShowProductSelectors={setShowProductSelectors}
      />
    );
  }

  return (
    <EditBundlePage
      actionData={actionData}
      bundle={bundle}
      defaultProducts={defaultProducts}
      isSubmitting={isSubmitting}
      queryA={queryA}
      queryB={queryB}
      selectedProductA={selectedProductA}
      selectedProductB={selectedProductB}
      setQueryA={setQueryA}
      setQueryB={setQueryB}
      setSelectedProductA={setSelectedProductA}
      setSelectedProductB={setSelectedProductB}
      shop={shop}
    />
  );
}

const createStyles = {
  page: {
    minHeight: "100%",
    background: "#f6f6f7",
    padding: "1.75rem 2rem 3rem",
  },
  container: {
    maxWidth: "920px",
    margin: "0 auto",
  },
  headingRow: {
    marginBottom: "1.5rem",
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.55rem",
    color: "#202223",
    textDecoration: "none",
    fontSize: "1.95rem",
    fontWeight: 700,
    lineHeight: 1.1,
  },
  backIcon: {
    width: "1.15rem",
    height: "1.15rem",
    color: "#202223",
    flexShrink: 0,
  },
  generalError: {
    marginBottom: "1rem",
    color: "#8b1e1e",
    fontSize: "0.92rem",
  },
  layout: {
    display: "grid",
    gridTemplateColumns: "1.95fr 1fr",
    gap: "1rem",
    alignItems: "start",
  },
  mainColumn: {
    display: "grid",
    gap: "1rem",
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e1e3e5",
    borderRadius: "1rem",
    boxShadow: "0 1px 0 rgba(0, 0, 0, 0.03)",
    padding: "0.95rem 1rem 1rem",
  },
  fieldLabel: {
    display: "block",
    fontSize: "0.95rem",
    fontWeight: 600,
    color: "#202223",
    marginBottom: "0.55rem",
  },
  titleInput: {
    width: "100%",
    borderRadius: "0.75rem",
    border: "1px solid #c9cccf",
    padding: "0.72rem 0.9rem",
    font: "inherit",
    fontSize: "0.98rem",
    color: "#202223",
    background: "#ffffff",
    outline: "none",
  },
  titleInputError: {
    borderColor: "#c9190b",
    boxShadow: "0 0 0 1px rgba(201, 25, 11, 0.12) inset",
    background: "#fff5f5",
  },
  fieldError: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.45rem",
    marginTop: "0.55rem",
    color: "#c9190b",
    fontSize: "0.88rem",
    fontWeight: 500,
  },
  fieldErrorIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1rem",
    height: "1rem",
    borderRadius: "999px",
    border: "1px solid currentColor",
    fontSize: "0.72rem",
    lineHeight: 1,
  },
  productsCard: {
    minHeight: "332px",
  },
  emptyProductsState: {
    minHeight: "300px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.95rem",
    textAlign: "center",
  },
  illustration: {
    width: "210px",
    height: "170px",
  },
  emptyProductsTitle: {
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "#5c5f62",
  },
  selectProductsButton: {
    border: 0,
    borderRadius: "0.65rem",
    background: "#2f3133",
    color: "#ffffff",
    padding: "0.68rem 1rem",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
  },
  productError: {
    marginTop: "0.35rem",
    color: "#c9190b",
    fontSize: "0.9rem",
    fontWeight: 500,
  },
  productSelectorArea: {
    display: "grid",
    gap: "1rem",
  },
  productsSummary: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
  },
  productsSummaryTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#202223",
  },
  secondaryTextButton: {
    border: 0,
    background: "transparent",
    color: "#2c6ecb",
    font: "inherit",
    cursor: "pointer",
    padding: 0,
  },
  productPickerGrid: {
    display: "grid",
    gap: "1rem",
  },
  sideCard: {
    background: "#ffffff",
    border: "1px solid #e1e3e5",
    borderRadius: "1rem",
    boxShadow: "0 1px 0 rgba(0, 0, 0, 0.03)",
    padding: "0.95rem 1rem 1rem",
  },
  sideTitle: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#202223",
    marginBottom: "0.7rem",
  },
  sideText: {
    margin: 0,
    color: "#5c5f62",
    fontSize: "0.96rem",
    lineHeight: 1.5,
  },
  sideList: {
    margin: "0.9rem 0 1rem",
    paddingLeft: "1.1rem",
    color: "#44474a",
    fontSize: "0.96rem",
    lineHeight: 1.55,
  },
  saveButton: {
    width: "100%",
    border: 0,
    borderRadius: "0.7rem",
    background: "#2f3133",
    color: "#ffffff",
    padding: "0.78rem 1rem",
    font: "inherit",
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "inset 0 0 0 1px rgba(255, 255, 255, 0.08)",
  },
};

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
  backLink: {
    color: "#2c6ecb",
    textDecoration: "none",
    fontWeight: 500,
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
  pushActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.85rem",
    flexWrap: "wrap",
  },
  inlineLink: {
    color: "#0f766e",
    textDecoration: "none",
  },
  deleteButton: {
    marginTop: "1rem",
    border: 0,
    background: "transparent",
    color: "#8b1e1e",
    padding: 0,
    cursor: "pointer",
    font: "inherit",
  },
};
