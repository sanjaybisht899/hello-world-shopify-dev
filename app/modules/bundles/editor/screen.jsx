import { useEffect, useState } from "react";
import { Form, Link, useFetcher } from "react-router";
import { toAdminProductUrl } from "../../shopify/product-links.js";
import { configStyles, createStyles } from "./styles.js";
import {
  getBundleProducts,
  getCombinedOptionGroups,
  getCreateProductError,
  getCreateTitleError,
  getMatchingOptionValueKeys,
  getOptionValueKey,
  getProductOptionGroups,
  getVariantCombinationCount,
  mergeUniqueProducts,
} from "./helpers.js";
import { useBundleEditorState } from "./use-bundle-editor-state.js";

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

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={createStyles.modalSearchIcon} aria-hidden="true">
      <circle cx="9" cy="9" r="4.75" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M12.6 12.6L15.8 15.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={createStyles.modalCloseIcon} aria-hidden="true">
      <path
        d="M6 6l8 8M14 6l-8 8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
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

function ProductThumbnail({ product }) {
  if (product?.image) {
    return (
      <img
        src={product.image}
        alt={product.imageAlt ?? product.title}
        style={createStyles.modalProductImage}
      />
    );
  }

  return (
    <div style={createStyles.modalProductPlaceholder}>
      {(product?.title ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function ProductSelectionModal({
  open,
  defaultProducts,
  initialProducts,
  onApply,
  onClose,
}) {
  const fetcher = useFetcher();
  const [searchQuery, setSearchQuery] = useState("");
  const [draftProducts, setDraftProducts] = useState(initialProducts);

  useEffect(() => {
    if (!open) {
      return;
    }

    setSearchQuery("");
    setDraftProducts(initialProducts);
  }, [initialProducts, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery.length < 2) {
      return;
    }

    fetcher.load(`/app/products/search?q=${encodeURIComponent(normalizedQuery)}`);
  }, [fetcher, open, searchQuery]);

  if (!open) {
    return null;
  }

  const normalizedQuery = searchQuery.trim();
  const searchResults =
    normalizedQuery.length >= 2 ? fetcher.data?.products ?? [] : defaultProducts;
  const products = mergeUniqueProducts(searchResults, draftProducts);
  const selectedIds = new Set(draftProducts.map((product) => product.id));
  const isSearching = normalizedQuery.length >= 2 && fetcher.state !== "idle";

  const toggleProduct = (product) => {
    setDraftProducts((currentProducts) => {
      const isSelected = currentProducts.some(
        (currentProduct) => currentProduct.id === product.id,
      );

      if (isSelected) {
        return currentProducts.filter(
          (currentProduct) => currentProduct.id !== product.id,
        );
      }

      if (currentProducts.length >= 2) {
        return currentProducts;
      }

      return [...currentProducts, product];
    });
  };

  return (
    <div
      style={createStyles.modalBackdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div role="dialog" aria-modal="true" style={createStyles.modalCard}>
        <div style={createStyles.modalHeader}>
          <div style={createStyles.modalTitle}>Select products</div>
          <button
            type="button"
            onClick={onClose}
            style={createStyles.modalCloseButton}
            aria-label="Close product selector"
          >
            <CloseIcon />
          </button>
        </div>

        <div style={createStyles.modalBody}>
          <div style={createStyles.modalSearchRow}>
            <div style={createStyles.modalSearchField}>
              <SearchIcon />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                style={createStyles.modalSearchInput}
              />
            </div>
            <select style={createStyles.modalSearchSelect} defaultValue="all">
              <option value="all">Search by All</option>
            </select>
          </div>

          <div style={createStyles.modalFilterRow}>
            <button type="button" style={createStyles.modalFilterButton}>
              Add filter +
            </button>
          </div>

          <div style={createStyles.modalList}>
            {isSearching ? (
              <div style={createStyles.modalEmptyState}>Searching products...</div>
            ) : products.length ? (
              products.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const disableSelection = draftProducts.length >= 2 && !isSelected;

                return (
                  <label
                    key={product.id}
                    style={{
                      ...createStyles.modalRow,
                      ...(isSelected ? createStyles.modalRowSelected : {}),
                      ...(disableSelection ? createStyles.modalRowDisabled : {}),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={disableSelection}
                      onChange={() => toggleProduct(product)}
                      style={createStyles.modalCheckbox}
                    />
                    <ProductThumbnail product={product} />
                    <div style={createStyles.modalProductText}>
                      <div style={createStyles.modalProductTitle}>{product.title}</div>
                    </div>
                  </label>
                );
              })
            ) : (
              <div style={createStyles.modalEmptyState}>
                No products matched this search.
              </div>
            )}
          </div>
        </div>

        <div style={createStyles.modalFooter}>
          <div style={createStyles.modalFooterCount}>
            {draftProducts.length}/2 products selected
          </div>
          <div style={createStyles.modalFooterActions}>
            <button
              type="button"
              onClick={onClose}
              style={createStyles.modalCancelButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                const [productA, productB] = draftProducts;
                onApply({ productA, productB });
                onClose();
              }}
              style={createStyles.modalSelectButton}
              disabled={draftProducts.length !== 2}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateBundlePage({
  actionData,
  defaultProducts,
  isSubmitting,
  selectedProductA,
  selectedProductB,
  setSelectedProductA,
  setSelectedProductB,
  isProductModalOpen,
  setIsProductModalOpen,
}) {
  const titleError = getCreateTitleError(actionData);
  const productError = getCreateProductError(actionData);
  const generalError =
    actionData?.error && !titleError && !productError ? actionData.error : null;
  const selectedCount = [selectedProductA, selectedProductB].filter(Boolean).length;
  const selectedProducts = [selectedProductA, selectedProductB].filter(Boolean);

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
                {selectedProducts.length ? (
                  <div style={createStyles.selectedProductsPanel}>
                    <div style={createStyles.selectedProductsHeader}>
                      <div style={createStyles.productsSummaryTitle}>Selected products</div>
                      <button
                        type="button"
                        onClick={() => setIsProductModalOpen(true)}
                        style={createStyles.secondaryTextButton}
                      >
                        Change products
                      </button>
                    </div>
                    <div style={createStyles.selectedProductsGrid}>
                      {selectedProducts.map((product, index) => (
                        <div key={product.id} style={createStyles.selectedProductCard}>
                          <ProductThumbnail product={product} />
                          <div style={createStyles.selectedProductCopy}>
                            <div style={createStyles.selectedProductLabel}>
                              Product {index + 1}
                            </div>
                            <div style={createStyles.selectedProductTitle}>
                              {product.title}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {productError ? (
                      <div style={createStyles.productError}>{productError}</div>
                    ) : null}
                  </div>
                ) : (
                  <div style={createStyles.emptyProductsState}>
                    <CreateBundleIllustration />
                    <div style={createStyles.emptyProductsTitle}>
                      Select the products you want to bundle.
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProductModalOpen(true)}
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

        <ProductSelectionModal
          open={isProductModalOpen}
          defaultProducts={defaultProducts}
          initialProducts={selectedProducts}
          onClose={() => setIsProductModalOpen(false)}
          onApply={({ productA, productB }) => {
            setSelectedProductA(productA ?? null);
            setSelectedProductB(productB ?? null);
          }}
        />
      </div>
    </div>
  );
}

function WarningIcon() {
  return (
    <span style={configStyles.warningIcon} aria-hidden="true">
      !
    </span>
  );
}

function CountListItem({ current, limit, label, exceeded = false }) {
  return (
    <li style={configStyles.metricItem}>
      <span style={configStyles.metricBullet} aria-hidden="true" />
      <span
        style={{
          ...configStyles.metricText,
          ...(exceeded ? configStyles.metricTextAlert : {}),
        }}
      >
        {current}/{limit} {label}
      </span>
      {exceeded ? <WarningIcon /> : null}
    </li>
  );
}

function OptionValueButton({ value, tone = "dark", isDisabled = false, onClick }) {
  const baseStyle =
    tone === "light" ? configStyles.lightValuePill : configStyles.darkValuePill;
  const disabledStyle =
    tone === "light"
      ? configStyles.lightValuePillDisabled
      : configStyles.darkValuePillDisabled;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...configStyles.valuePillButton,
        ...baseStyle,
        ...(isDisabled ? disabledStyle : {}),
      }}
      aria-pressed={!isDisabled}
    >
      {value}
    </button>
  );
}

function EditBundlePage({
  actionData,
  bundle,
  defaultProducts,
  isSubmitting,
  selectedProductA,
  selectedProductB,
  setSelectedProductA,
  setSelectedProductB,
  isProductModalOpen,
  setIsProductModalOpen,
  combineMatchingOptions,
  setCombineMatchingOptions,
  disabledOptionValueKeys,
  setDisabledOptionValueKeys,
  shop,
}) {
  const titleError = getCreateTitleError(actionData);
  const productError = getCreateProductError(actionData);
  const generalError =
    actionData?.error && !titleError && !productError ? actionData.error : null;
  const nameDefaultValue = actionData?.values?.name ?? bundle?.name ?? "";
  const selectedProducts = getBundleProducts(selectedProductA, selectedProductB);
  const optionGroups = getProductOptionGroups(selectedProducts, shop);
  const disabledOptionValueKeySet = new Set(disabledOptionValueKeys);
  const displayedOptionGroups = combineMatchingOptions
    ? getCombinedOptionGroups(optionGroups)
    : optionGroups;
  const bundleProductUrl = toAdminProductUrl(shop, bundle?.bundleProduct?.id);
  const optionCount = displayedOptionGroups.length;
  const variantCombinationCount = getVariantCombinationCount(
    selectedProducts,
    disabledOptionValueKeySet,
  );
  const exceedsOptionLimit = optionCount > 4;
  const exceedsVariantLimit = variantCombinationCount > 10000;

  const toggleOptionValue = ({ productId, optionName, value, combineAll = false }) => {
    const targetKeys =
      combineAll || combineMatchingOptions
        ? getMatchingOptionValueKeys(optionGroups, optionName, value)
        : [getOptionValueKey(productId, optionName, value)];

    setDisabledOptionValueKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      const shouldDisable = targetKeys.some((targetKey) => !nextKeys.has(targetKey));

      for (const targetKey of targetKeys) {
        if (shouldDisable) {
          nextKeys.add(targetKey);
        } else {
          nextKeys.delete(targetKey);
        }
      }

      return [...nextKeys];
    });
  };

  const isOptionValueDisabled = ({ productId, optionName, value, combineAll = false }) => {
    const targetKeys =
      combineAll || combineMatchingOptions
        ? getMatchingOptionValueKeys(optionGroups, optionName, value)
        : [getOptionValueKey(productId, optionName, value)];

    if (!targetKeys.length) {
      return false;
    }

    return targetKeys.every((targetKey) => disabledOptionValueKeySet.has(targetKey));
  };

  useEffect(() => {
    if (!combineMatchingOptions) {
      return;
    }

    setDisabledOptionValueKeys((currentKeys) => {
      const nextKeys = new Set(currentKeys);
      let hasChanges = false;

      for (const optionGroup of optionGroups) {
        for (const value of optionGroup.values ?? []) {
          const matchingKeys = getMatchingOptionValueKeys(
            optionGroups,
            optionGroup.optionName,
            value,
          );

          if (!matchingKeys.some((matchingKey) => nextKeys.has(matchingKey))) {
            continue;
          }

          for (const matchingKey of matchingKeys) {
            if (!nextKeys.has(matchingKey)) {
              nextKeys.add(matchingKey);
              hasChanges = true;
            }
          }
        }
      }

      return hasChanges ? [...nextKeys] : currentKeys;
    });
  }, [combineMatchingOptions, optionGroups, setDisabledOptionValueKeys]);

  return (
    <div style={configStyles.page}>
      <div style={configStyles.container}>
        <div style={configStyles.pageHeader}>
          <div style={configStyles.pageTitleBlock}>
            <Link to="/app" style={configStyles.pageTitleLink}>
              <BackArrow />
              <span>Edit Bundle</span>
            </Link>
            <div style={configStyles.pageSubtitle}>{bundle.name}</div>
          </div>
          <div style={configStyles.pageHeaderActions}>
            {bundleProductUrl ? (
              <a
                href={bundleProductUrl}
                target="_top"
                rel="noreferrer"
                style={configStyles.headerActionButton}
              >
                View bundle product
              </a>
            ) : (
              <Form method="post">
                <input type="hidden" name="intent" value="push" />
                <button
                  type="submit"
                  style={configStyles.headerActionButton}
                  disabled={isSubmitting}
                >
                  Push bundle product
                </button>
              </Form>
            )}
          </div>
        </div>

        {generalError ? <div style={configStyles.errorBanner}>{generalError}</div> : null}
        {actionData?.success ? (
          <div style={configStyles.successBanner}>{actionData.success}</div>
        ) : null}

        <Form method="post">
          <div style={configStyles.layout}>
            <div style={configStyles.mainColumn}>
              <section style={configStyles.card}>
                <label style={configStyles.fieldLabel}>Title</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={nameDefaultValue}
                  placeholder="T-Shirt Bundle"
                  style={{
                    ...configStyles.titleInput,
                    ...(titleError ? configStyles.titleInputError : {}),
                  }}
                />
                {titleError ? (
                  <div style={configStyles.fieldError}>
                    <span style={configStyles.fieldErrorIcon}>!</span>
                    <span>{titleError}</span>
                  </div>
                ) : null}
              </section>

              <section style={configStyles.card}>
                <div style={configStyles.sectionHeader}>
                  <div style={configStyles.sectionTitle}>Products</div>
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(true)}
                    style={configStyles.sectionAction}
                  >
                    Add products
                  </button>
                </div>

                {productError ? (
                  <div style={configStyles.inlineError}>{productError}</div>
                ) : null}

                <div style={configStyles.productCardList}>
                  {selectedProducts.map((product) => {
                    const productUrl = toAdminProductUrl(shop, product.id);

                    return (
                      <div key={product.id} style={configStyles.productCard}>
                        <div style={configStyles.productCardHeader}>
                          <div style={configStyles.productIdentity}>
                            <ProductThumbnail product={product} />
                            <div style={configStyles.productIdentityTitle}>{product.title}</div>
                          </div>
                          <div style={configStyles.productCardControls}>
                            {productUrl ? (
                              <a
                                href={productUrl}
                                target="_top"
                                rel="noreferrer"
                                style={configStyles.productEditLink}
                              >
                                Edit
                              </a>
                            ) : null}
                            <input
                              type="number"
                              value="1"
                              readOnly
                              style={configStyles.quantityInput}
                            />
                            <button type="button" style={configStyles.moreButton}>
                              ...
                            </button>
                          </div>
                        </div>

                        {(product.options ?? []).length ? (
                          product.options.map((option) => (
                            <div
                              key={`${product.id}-${option.id ?? option.name}`}
                              style={configStyles.optionGroup}
                            >
                              <div style={configStyles.optionGroupHeader}>
                                <div style={configStyles.optionName}>
                                  {`${product.title} (${String(option.name).toLowerCase()})`}
                                </div>
                              </div>
                              <div style={configStyles.darkValueRow}>
                                {option.values.map((value) => (
                                  <OptionValueButton
                                    key={`${product.id}-${option.name}-${value}`}
                                    value={value}
                                    isDisabled={isOptionValueDisabled({
                                      productId: product.id,
                                      optionName: option.name,
                                      value,
                                    })}
                                    onClick={() => {
                                      toggleOptionValue({
                                        productId: product.id,
                                        optionName: option.name,
                                        value,
                                      });
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={configStyles.emptyOptionText}>
                            This product has no configurable options.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <input type="hidden" name="productAId" value={selectedProductA?.id ?? ""} />
                <input type="hidden" name="productBId" value={selectedProductB?.id ?? ""} />
              </section>
            </div>

            <aside style={configStyles.sideCard}>
              <div style={configStyles.sideSection}>
                <div style={configStyles.sideTitle}>Components</div>
                <p style={configStyles.sideText}>
                  Bundles can include two existing Shopify products. Limits for bundle
                  options and variants are tracked here for the dynamic storefront setup.
                </p>
                <ul style={configStyles.metricList}>
                  <CountListItem current={selectedProducts.length} limit={2} label="bundled products" />
                  <CountListItem
                    current={optionCount}
                    limit={4}
                    label="options"
                    exceeded={exceedsOptionLimit}
                  />
                  <CountListItem
                    current={variantCombinationCount}
                    limit={10000}
                    label="variants"
                    exceeded={exceedsVariantLimit}
                  />
                </ul>
              </div>

              <div style={configStyles.sideDivider} />

              <div style={configStyles.sideSection}>
                <div style={configStyles.sideTitle}>Options</div>
                <p style={configStyles.sideText}>
                  Buyers will be able to choose from these options.
                </p>
                <div style={configStyles.optionSummaryList}>
                  {displayedOptionGroups.map((group) => (
                    <div key={group.key} style={configStyles.optionSummaryGroup}>
                      <div style={configStyles.optionSummaryTitle}>
                        {"productTitle" in group
                          ? `${group.productTitle} (${String(group.optionName).toLowerCase()})`
                          : String(group.optionName).toLowerCase()}
                      </div>
                      <div style={configStyles.lightValueRow}>
                        {group.values.map((value) => (
                          <OptionValueButton
                            key={`${group.key}-${value}`}
                            value={value}
                            tone="light"
                            isDisabled={isOptionValueDisabled({
                              productId: group.productId,
                              optionName: group.optionName,
                              value,
                              combineAll: !("productId" in group),
                            })}
                            onClick={() => {
                              toggleOptionValue({
                                productId: group.productId,
                                optionName: group.optionName,
                                value,
                                combineAll: !("productId" in group),
                              });
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <label style={configStyles.checkboxRow}>
                  <input
                    type="checkbox"
                    name="combineMatchingOptions"
                    value="true"
                    checked={combineMatchingOptions}
                    onChange={(event) => {
                      setCombineMatchingOptions(event.target.checked);
                    }}
                    style={configStyles.checkbox}
                  />
                  <span>Combine options with matching names</span>
                </label>
                <input type="hidden" name="redirectTo" value="product-page" />
                <button
                  type="submit"
                  name="intent"
                  value="save"
                  style={configStyles.primaryButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save and continue"}
                </button>
              </div>
            </aside>
          </div>
        </Form>

        <div style={configStyles.footerActions}>
          {bundle.bundleProduct ? (
            <Form method="post">
              <input type="hidden" name="intent" value="push" />
              <button
                type="submit"
                style={configStyles.footerSecondaryButton}
                disabled={isSubmitting}
              >
                Sync bundle product
              </button>
            </Form>
          ) : null}
          <Form method="post">
            <input type="hidden" name="intent" value="delete" />
            <button
              type="submit"
              style={configStyles.footerDeleteButton}
              disabled={isSubmitting}
            >
              Delete bundle
            </button>
          </Form>
        </div>

        <ProductSelectionModal
          open={isProductModalOpen}
          defaultProducts={defaultProducts}
          initialProducts={selectedProducts}
          onClose={() => setIsProductModalOpen(false)}
          onApply={({ productA, productB }) => {
            setSelectedProductA(productA ?? null);
            setSelectedProductB(productB ?? null);
          }}
        />
      </div>
    </div>
  );
}

export function BundleEditorScreen({ bundle, defaultProducts, shop, actionData, isSubmitting }) {
  const {
    selectedProductA,
    selectedProductB,
    setSelectedProductA,
    setSelectedProductB,
    isProductModalOpen,
    setIsProductModalOpen,
    combineMatchingOptions,
    setCombineMatchingOptions,
    disabledOptionValueKeys,
    setDisabledOptionValueKeys,
  } = useBundleEditorState({ bundle, actionData, shop });

  if (!bundle) {
    return (
      <CreateBundlePage
        actionData={actionData}
        defaultProducts={defaultProducts}
        isSubmitting={isSubmitting}
        selectedProductA={selectedProductA}
        selectedProductB={selectedProductB}
        setSelectedProductA={setSelectedProductA}
        setSelectedProductB={setSelectedProductB}
        isProductModalOpen={isProductModalOpen}
        setIsProductModalOpen={setIsProductModalOpen}
      />
    );
  }

  return (
    <EditBundlePage
      actionData={actionData}
      bundle={bundle}
      defaultProducts={defaultProducts}
      isSubmitting={isSubmitting}
      selectedProductA={selectedProductA}
      selectedProductB={selectedProductB}
      setSelectedProductA={setSelectedProductA}
      setSelectedProductB={setSelectedProductB}
      isProductModalOpen={isProductModalOpen}
      setIsProductModalOpen={setIsProductModalOpen}
      combineMatchingOptions={combineMatchingOptions}
      setCombineMatchingOptions={setCombineMatchingOptions}
      disabledOptionValueKeys={disabledOptionValueKeys}
      setDisabledOptionValueKeys={setDisabledOptionValueKeys}
      shop={shop}
    />
  );
}
