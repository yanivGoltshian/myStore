import type { MetadataRoute } from "next";
import { products, categories, site } from "@/lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/deals/`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/finder/`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/contact/`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/faq/`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/returns/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/accessibility/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories
    // Lighting (id 9000 + its subcategories, parent 9000) is an unlisted sub-catalog:
    // reachable by direct link only, so keep it out of the sitemap.
    .filter((c) => c.id !== 9000 && c.parent !== 9000)
    .map((c) => ({
      url: `${base}/category/${c.id}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.id}/`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
