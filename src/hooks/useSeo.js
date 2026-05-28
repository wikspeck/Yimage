import { useEffect } from "react";

const DEFAULT_TITLE = "Yimage - Social Image Sharing Platform";
const DEFAULT_DESCRIPTION = "Fast and modern social image sharing platform for discovering, uploading, and sharing images.";
const DEFAULT_IMAGE = "https://yimage.org/yimage-logo-app.png";

function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function upsertLink(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

function upsertJsonLd(id, value) {
  let element = document.head.querySelector(`script[data-seo-jsonld="${id}"]`);

  if (!value) {
    element?.remove();
    return;
  }

  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.setAttribute("data-seo-jsonld", id);
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(value);
}

export function useSeo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  robots,
  jsonLd
}) {
  useEffect(() => {
    const canonicalUrl = canonicalPath.startsWith("http") ? canonicalPath : `https://yimage.org${canonicalPath}`;

    document.title = title;

    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

    if (robots) {
      upsertMeta('meta[name="robots"]', { name: "robots", content: robots });
    }

    upsertLink('link[rel="canonical"]', { rel: "canonical", href: canonicalUrl });
    upsertJsonLd("primary", jsonLd || null);

    return () => {
      if (robots) {
        document.head.querySelector('meta[name="robots"]')?.remove();
      }
      if (jsonLd) {
        document.head.querySelector('script[data-seo-jsonld="primary"]')?.remove();
      }
    };
  }, [canonicalPath, description, image, jsonLd, robots, title, type]);
}

export const seoDefaults = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  image: DEFAULT_IMAGE
};
