import { STATUS_OPTIONS } from "./constants.js";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function toDescriptionHtml(value) {
  const paragraphs = String(value ?? "")
    .trim()
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`);

  return paragraphs.join("");
}

export function fromDescriptionHtml(value) {
  return String(value ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replaceAll("&nbsp;", " ")
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

export function parseTags(value) {
  return String(value ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatTags(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

export function formatStatus(value) {
  const normalizedStatus = String(value ?? "DRAFT").toUpperCase();
  return STATUS_OPTIONS.find((option) => option.value === normalizedStatus)?.label ?? "Draft";
}

export function buildDefaultDescription(bundle) {
  const bundledProducts = [bundle.productA, bundle.productB].filter(Boolean);

  return [
    "This bundle product includes:",
    ...bundledProducts.map((product) => `- ${product.title}`),
    "",
    "Select the variants for both products in the bundle experience before checkout.",
  ].join("\n");
}

export function getBundleMediaGallery(bundle) {
  const seenUrls = new Set();
  const gallery = [];

  for (const product of [bundle.bundleProduct, bundle.productA, bundle.productB].filter(Boolean)) {
    const productMedia = product.media?.length
      ? product.media
      : product.image
        ? [{ url: product.image, alt: product.imageAlt ?? product.title }]
        : [];

    for (const image of productMedia) {
      const url = String(image.url ?? image.originalSource ?? "").trim();

      if (!url || seenUrls.has(url)) {
        continue;
      }

      seenUrls.add(url);
      gallery.push({
        url,
        alt: image.alt ?? product.title,
        productTitle: product.title,
      });
    }
  }

  return gallery.slice(0, 6);
}

export function getProductPageDefaults(bundle, shopName) {
  return {
    title: bundle.bundleProduct?.title ?? bundle.name,
    description:
      fromDescriptionHtml(bundle.bundleProduct?.descriptionHtml) ||
      buildDefaultDescription(bundle),
    status: String(bundle.bundleProduct?.status ?? "DRAFT").toUpperCase(),
    productType: bundle.bundleProduct?.productType ?? "",
    vendor: bundle.bundleProduct?.vendor ?? shopName,
    collections: "",
    tags: formatTags(bundle.bundleProduct?.tags),
    themeTemplate: "default",
    category: "",
  };
}

export function getBundleProductFormValues(formData) {
  return {
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "DRAFT").toUpperCase(),
    productType: String(formData.get("productType") ?? ""),
    vendor: String(formData.get("vendor") ?? ""),
    collections: String(formData.get("collections") ?? ""),
    tags: String(formData.get("tags") ?? ""),
    themeTemplate: String(formData.get("themeTemplate") ?? "default"),
    category: String(formData.get("category") ?? ""),
  };
}
