import { Form, Link } from "react-router";
import { STATUS_OPTIONS } from "./constants.js";
import { formatStatus, getBundleMediaGallery } from "./helpers.js";
import { styles } from "./styles.js";

function BackArrow() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.backIcon} aria-hidden="true">
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

function BundleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.sectionIcon} aria-hidden="true">
      <rect x="4" y="5" width="12" height="10" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 5v10M13 5v10M4 8.5h12" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.inlineIcon} aria-hidden="true">
      <path
        d="M6.5 13.5l-.7 2.7 2.7-.7 6.1-6.1-2-2-6.1 6.1z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M11.9 6.8l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.inlineIcon} aria-hidden="true">
      <path d="M4.5 6.5h7M13.5 6.5h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="12.5" cy="6.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 13.5h2M8.5 13.5h7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7.5" cy="13.5" r="1.8" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.inlineIcon} aria-hidden="true">
      <circle cx="10" cy="10" r="6.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 8.2v4.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="10" cy="6.1" r=".8" fill="currentColor" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.inlineIcon} aria-hidden="true">
      <path
        d="M2.8 10s2.5-4.2 7.2-4.2S17.2 10 17.2 10 14.7 14.2 10 14.2 2.8 10 2.8 10z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.inlineIcon} aria-hidden="true">
      <path d="M4.3 7.3h11.4v8.2H4.3z" stroke="currentColor" strokeWidth="1.3" />
      <path d="M5.4 7.3l1-3h7.2l1 3" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M8 15.5v-3.8h4v3.8" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.inlineIcon} aria-hidden="true">
      <circle cx="9" cy="9" r="4.6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M12.5 12.5L15.7 15.7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ToolbarButton({ children, wide = false }) {
  return (
    <button
      type="button"
      style={{
        ...styles.toolbarButton,
        ...(wide ? styles.toolbarButtonWide : {}),
      }}
    >
      {children}
    </button>
  );
}

function BundledProductRow({ product }) {
  return (
    <div style={styles.bundleRow}>
      {product.image ? (
        <img
          src={product.image}
          alt={product.imageAlt ?? product.title}
          style={styles.bundleRowImage}
        />
      ) : (
        <div style={styles.bundleRowPlaceholder}>
          {product.title.slice(0, 1).toUpperCase()}
        </div>
      )}
      <div style={styles.bundleRowCopy}>
        <div style={styles.bundleRowTitle}>{product.title}</div>
        <div style={styles.bundleRowMeta}>{product.variantCount ?? 0} variants</div>
      </div>
    </div>
  );
}

export function BundleProductScreen({
  actionData,
  bundle,
  bundleProductUrl,
  defaults,
  isSubmitting,
  saved,
}) {
  const values = actionData?.values ?? defaults;
  const bundledProducts = [bundle.productA, bundle.productB].filter(Boolean);
  const mediaGallery = getBundleMediaGallery(bundle);
  const pageTitle = values.title?.trim() || bundle.name;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div style={styles.titleBlock}>
            <Link to={`/app/bundles/${bundle.id}`} style={styles.backLink}>
              <BackArrow />
              <span>Back to bundle</span>
            </Link>
            <h1 style={styles.pageTitle}>{pageTitle}</h1>
            <div style={styles.statusText}>{formatStatus(values.status)}</div>
          </div>
          <div style={styles.headerActions}>
            {bundleProductUrl ? (
              <a
                href={bundleProductUrl}
                target="_top"
                rel="noreferrer"
                style={styles.secondaryHeaderButton}
              >
                View bundle product
              </a>
            ) : null}
            <button
              type="submit"
              form="bundle-product-form"
              style={styles.primaryHeaderButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {saved ? <div style={styles.successBanner}>Bundle product saved successfully.</div> : null}
        {actionData?.error ? <div style={styles.errorBanner}>{actionData.error}</div> : null}

        <Form id="bundle-product-form" method="post">
          <div style={styles.layout}>
            <div style={styles.mainColumn}>
              <section style={styles.card}>
                <label style={styles.label}>Title</label>
                <input type="text" name="title" defaultValue={values.title} style={styles.input} />

                <div style={styles.sectionSpacing}>
                  <label style={styles.label}>Description</label>
                  <div style={styles.editorCard}>
                    <div style={styles.toolbar}>
                      <ToolbarButton>&#10022;</ToolbarButton>
                      <ToolbarButton wide>Paragraph</ToolbarButton>
                      <div style={styles.toolbarDivider} />
                      <ToolbarButton>B</ToolbarButton>
                      <ToolbarButton>I</ToolbarButton>
                      <ToolbarButton>U</ToolbarButton>
                      <ToolbarButton>A</ToolbarButton>
                      <div style={styles.toolbarDivider} />
                      <ToolbarButton>&#9776;</ToolbarButton>
                      <ToolbarButton>&lt;/&gt;</ToolbarButton>
                    </div>
                    <textarea
                      name="description"
                      defaultValue={values.description}
                      style={styles.textarea}
                    />
                  </div>
                </div>

                <div style={styles.sectionSpacing}>
                  <div style={styles.label}>Media</div>
                  <div style={styles.mediaCard}>
                    {mediaGallery.length ? (
                      <div style={styles.mediaGrid}>
                        {mediaGallery.map((image) => (
                          <div key={`${image.productTitle}-${image.url}`} style={styles.mediaTile}>
                            <img src={image.url} alt={image.alt} style={styles.mediaTileImage} />
                            <div style={styles.mediaTileLabel}>{image.productTitle}</div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div style={styles.mediaActions}>
                      <button type="button" style={styles.secondaryButton} disabled>
                        Upload new
                      </button>
                      <button type="button" style={styles.ghostButton} disabled>
                        Select existing
                      </button>
                    </div>
                    <div style={styles.mediaHelper}>
                      {mediaGallery.length
                        ? "Bundle product media syncs from the bundled products when you save."
                        : "Accepts images, videos, or 3D models"}
                    </div>
                  </div>
                </div>

                <div style={styles.sectionSpacing}>
                  <div style={styles.label}>Category</div>
                  <select name="category" defaultValue={values.category} style={styles.select}>
                    <option value="">Choose a product category</option>
                  </select>
                  <div style={styles.helperText}>
                    Determines tax rates and adds metafields to improve search, filters,
                    and cross-channel sales.
                  </div>
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.bundleHeader}>
                  <div style={styles.bundleHeadingWrap}>
                    <BundleIcon />
                    <div style={styles.bundleHeading}>Bundled products</div>
                  </div>
                  <Link to={`/app/bundles/${bundle.id}`} style={styles.iconActionLink}>
                    <PencilIcon />
                  </Link>
                </div>
                <div style={styles.bundleCount}>Showing {bundledProducts.length} bundled products</div>
                <div style={styles.bundleList}>
                  {bundledProducts.map((product) => (
                    <BundledProductRow key={product.id} product={product} />
                  ))}
                </div>
              </section>
            </div>

            <div style={styles.sideColumn}>
              <section style={styles.card}>
                <label style={styles.label}>Status</label>
                <select name="status" defaultValue={values.status} style={styles.select}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </section>

              <section style={styles.card}>
                <div style={styles.sideCardHeader}>
                  <div style={styles.sideHeading}>Publishing</div>
                  <SettingsIcon />
                </div>
                <div style={styles.channelPill}>
                  <StoreIcon />
                  <span>Online Store</span>
                </div>
              </section>

              <section style={styles.card}>
                <div style={styles.sideHeading}>Sales</div>
                <div style={styles.sideText}>No recent sales of this product</div>
                <div style={styles.viewDetails}>View details</div>
              </section>

              <section style={styles.card}>
                <div style={styles.sideCardHeader}>
                  <div style={styles.sideHeading}>Product organization</div>
                  <InfoIcon />
                </div>

                <label style={styles.sideLabel}>Type</label>
                <input
                  type="text"
                  name="productType"
                  defaultValue={values.productType}
                  style={styles.input}
                />

                <label style={styles.sideLabel}>Vendor</label>
                <input type="text" name="vendor" defaultValue={values.vendor} style={styles.input} />

                <label style={styles.sideLabel}>Collections</label>
                <div style={styles.searchField}>
                  <span style={styles.searchFieldIcon}>
                    <SearchIcon />
                  </span>
                  <input
                    type="text"
                    name="collections"
                    defaultValue={values.collections}
                    style={styles.searchInput}
                  />
                </div>

                <label style={styles.sideLabel}>Tags</label>
                <input type="text" name="tags" defaultValue={values.tags} style={styles.input} />
              </section>

              <section style={styles.card}>
                <div style={styles.sideCardHeader}>
                  <div style={styles.sideHeading}>Theme template</div>
                  <EyeIcon />
                </div>
                <select
                  name="themeTemplate"
                  defaultValue={values.themeTemplate}
                  style={styles.select}
                >
                  <option value="default">Default product</option>
                </select>
              </section>
            </div>
          </div>
        </Form>
      </div>
    </div>
  );
}
