import type { MetadataRoute } from "next";
import { site } from "@/lib/data";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  const themeColor = site.theme?.primary || "#862421";
  // When a custom favicon is uploaded use it for the "any" install icons
  // (a single 512px square scales down cleanly). Maskable icons keep the
  // bundled branded versions so the safe-zone padding stays correct.
  const anyIcon = site.favicon;
  const icons: MetadataRoute.Manifest["icons"] = anyIcon
    ? [
        { src: anyIcon, sizes: "192x192", type: "image/png", purpose: "any" },
        { src: anyIcon, sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ]
    : [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
        { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ];
  return {
    name: site.name,
    short_name: site.name,
    description:
      "חנות מוצרי החשמל והמכשירים החשמליים לבית ולמטבח — מוצרי מטבח, קיץ, חורף, טיפוח, ניקיון ותאורה במחירים משתלמים.",
    lang: "he",
    dir: "rtl",
    start_url: "/?utm_source=pwa",
    scope: "/",
    id: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: themeColor,
    categories: ["shopping", "lifestyle"],
    prefer_related_applications: false,
    icons,
  };
}
