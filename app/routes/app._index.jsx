import { Link, data, useLoaderData } from "react-router";
import { listBundleCards } from "../modules/bundles/bundle.service.server.js";
import { authenticate } from "../shopify.server";

const moneyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function getVariantPrice(product) {
  const rawPrice = product?.variants?.[0]?.price;
  const price = Number(rawPrice);

  return Number.isFinite(price) ? price : null;
}

function getBundlePrice(bundle) {
  const productAPrice = getVariantPrice(bundle.productA);
  const productBPrice = getVariantPrice(bundle.productB);

  if (productAPrice == null || productBPrice == null) {
    return null;
  }

  return productAPrice + productBPrice;
}

function formatBundlePrice(bundle) {
  const total = getBundlePrice(bundle);

  return total == null ? "--" : moneyFormatter.format(total);
}

function BundleThumbnail() {
  return (
    <div style={styles.thumbnailFrame} aria-hidden="true">
      <svg viewBox="0 0 20 20" fill="none" style={styles.thumbnailSvg}>
        <rect x="4.25" y="4.25" width="11.5" height="11.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="8" cy="8" r="1.1" fill="currentColor" />
        <path
          d="M6.5 13.25l2.2-2.3 1.85 1.9 2.95-3.1"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

function WindowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" style={styles.windowSvg} aria-hidden="true">
      <rect x="3.5" y="4.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6.5 3.5v3M13.5 3.5v3M3.5 8h13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const bundles = await listBundleCards({ admin, shop: session.shop });

  return data({ bundles, shop: session.shop });
};

export default function BundleListPage() {
  const { bundles, shop } = useLoaderData();
  const productListUrl = `https://${shop}/admin/products`;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.heading}>Bundles</h1>
          </div>
          <div style={styles.headerActions}>
            <a href={productListUrl} target="_top" rel="noreferrer" style={styles.secondaryLink}>
              View in product list
            </a>
            <Link to="/app/bundles/new" style={styles.primaryLink}>
              Create bundle
            </Link>
          </div>
        </div>

        <section style={styles.metricsCard}>
          <div style={styles.windowCell}>
            <div style={styles.windowIcon}>
              <WindowIcon />
            </div>
            <div style={styles.windowLabel}>30 days</div>
          </div>
          <div style={styles.metricCell}>
            <div style={styles.metricLabel}>Bundle total sales</div>
            <div style={styles.metricValue}>INR 0 --</div>
            <div style={styles.metricBar} />
          </div>
          <div style={styles.metricCell}>
            <div style={styles.metricLabel}>Bundle orders</div>
            <div style={styles.metricValue}>0 --</div>
            <div style={styles.metricBar} />
          </div>
          <div style={styles.metricCell}>
            <div style={styles.metricLabel}>Top total sales</div>
            <div style={styles.metricValueMuted}>No data</div>
          </div>
          <div style={styles.metricCell}>
            <div style={styles.metricLabel}>Most ordered</div>
            <div style={styles.metricValueMuted}>No data</div>
          </div>
        </section>

        <section style={styles.listCard}>
          <div style={styles.tableHeader}>
            <div>Title</div>
            <div>Price</div>
          </div>
          {bundles.length ? (
            bundles.map((bundle, index) => (
              <div
                key={bundle.id}
                style={{
                  ...styles.row,
                  ...(index < bundles.length - 1 ? styles.rowBorder : {}),
                }}
              >
                <div style={styles.titleCell}>
                  <BundleThumbnail />
                  <Link to={`/app/bundles/${bundle.id}`} style={styles.bundleLink}>
                    {bundle.name}
                  </Link>
                </div>
                <div style={styles.priceCell}>{formatBundlePrice(bundle)}</div>
              </div>
            ))
          ) : (
            <div style={styles.emptyState}>No bundles yet. Create your first bundle.</div>
          )}
        </section>

        <div style={styles.footerNote}>
          Learn more about <Link to="/app/bundles/new" style={styles.footerLink}>creating bundles</Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100%",
    background: "#f6f6f7",
    padding: "1.5rem 2rem 3rem",
  },
  container: {
    maxWidth: "880px",
    margin: "0 auto",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "1rem",
    marginBottom: "1rem",
  },
  heading: {
    margin: 0,
    fontSize: "2rem",
    lineHeight: 1.2,
    fontWeight: 700,
    color: "#202223",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  primaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.6rem",
    background: "#202223",
    color: "#ffffff",
    padding: "0.55rem 0.9rem",
    textDecoration: "none",
    fontSize: "0.85rem",
    fontWeight: 600,
    boxShadow: "inset 0 0 0 1px rgba(0, 0, 0, 0.16)",
  },
  secondaryLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "0.6rem",
    background: "#ffffff",
    color: "#202223",
    padding: "0.55rem 0.9rem",
    textDecoration: "none",
    fontSize: "0.85rem",
    fontWeight: 600,
    boxShadow: "inset 0 0 0 1px #d2d5d8",
  },
  metricsCard: {
    display: "grid",
    gridTemplateColumns: "0.9fr 1.45fr 1.45fr 1.4fr 1.4fr",
    background: "#ffffff",
    borderRadius: "0.95rem",
    border: "1px solid #e3e5e7",
    overflow: "hidden",
    marginBottom: "0.9rem",
  },
  windowCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.95rem 1rem",
    borderRight: "1px solid #e3e5e7",
    color: "#202223",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
  windowIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "1.1rem",
    height: "1.1rem",
    color: "#202223",
  },
  windowSvg: {
    width: "1rem",
    height: "1rem",
    color: "#202223",
  },
  windowLabel: {
    whiteSpace: "nowrap",
  },
  metricCell: {
    padding: "0.7rem 1rem",
    borderRight: "1px solid #e3e5e7",
  },
  metricLabel: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#202223",
    marginBottom: "0.35rem",
  },
  metricValue: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "#202223",
    marginBottom: "0.45rem",
  },
  metricValueMuted: {
    fontSize: "0.95rem",
    color: "#6d7175",
  },
  metricBar: {
    height: "2px",
    borderRadius: "999px",
    background: "#2c6ecb",
    width: "100%",
  },
  listCard: {
    background: "#ffffff",
    borderRadius: "0.95rem",
    border: "1px solid #e3e5e7",
    overflow: "hidden",
  },
  tableHeader: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "1rem",
    padding: "0.65rem 1rem",
    fontSize: "0.78rem",
    color: "#6d7175",
    borderBottom: "1px solid #eef0f1",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr auto",
    gap: "1rem",
    alignItems: "center",
    padding: "1rem",
  },
  rowBorder: {
    borderBottom: "1px solid #eef0f1",
  },
  titleCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    minWidth: 0,
  },
  thumbnailFrame: {
    width: "1.95rem",
    height: "1.95rem",
    borderRadius: "0.45rem",
    background: "#ffffff",
    border: "1px solid #e3e5e7",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  thumbnailSvg: {
    width: "0.95rem",
    height: "0.95rem",
    color: "#8c9196",
  },
  bundleLink: {
    color: "#202223",
    textDecoration: "none",
    fontSize: "0.92rem",
    fontWeight: 600,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  priceCell: {
    color: "#202223",
    fontSize: "0.92rem",
    fontWeight: 500,
    textAlign: "right",
  },
  emptyState: {
    padding: "1rem",
    color: "#6d7175",
    fontSize: "0.92rem",
  },
  footerNote: {
    marginTop: "1.5rem",
    textAlign: "center",
    color: "#6d7175",
    fontSize: "0.92rem",
  },
  footerLink: {
    color: "#2c6ecb",
    textDecoration: "none",
    fontWeight: 600,
  },
};
