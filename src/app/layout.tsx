import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ConditionalChrome from "@/components/ConditionalChrome";
import ScrollToTop from "@/components/ScrollToTop";
import PWARegister from "@/components/PWARegister";
import ScrollReveal from "@/components/ScrollReveal";
import InstallPrompt from "@/components/InstallPrompt";
import AccessibilityWidget from "@/components/AccessibilityWidget";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { QuickViewProvider } from "@/lib/quickview";
import QuickViewModal from "@/components/QuickViewModal";
import { site } from "@/lib/data";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

// Derive a darker shade of the brand color (used for hover/active states).
function darken(hex: string, amt = 0.18): string {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = Math.max(0, Math.round(((n >> 16) & 255) * (1 - amt)));
  const g = Math.max(0, Math.round(((n >> 8) & 255) * (1 - amt)));
  const b = Math.max(0, Math.round((n & 255) * (1 - amt)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

const brandPrimary = site.theme?.primary || "#862421";
const brandPrimaryDark = darken(brandPrimary);

// Favicon / app icons. When the admin uploads a custom favicon
// (site.favicon set) it becomes authoritative for the tab icon, the
// apple-touch icon and the shortcut. Otherwise fall back to the bundled
// branded icons in public/ (icon.svg + favicon.ico + apple-icon.png).
const iconsMeta: Metadata["icons"] = site.favicon
  ? {
      icon: [
        { url: site.favicon, type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      shortcut: [{ url: site.favicon }],
      apple: [{ url: site.favicon }],
    }
  : {
      icon: [
        { url: "/icon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
    };

const title = `${site.name} | ${site.tagline}`;
const description = `${site.name} — חנות מוצרי החשמל והמכשירים החשמליים לבית ולמטבח. מוצרי מטבח, קיץ, חורף, טיפוח וניקיון במחירים משתלמים, באחריות מלאה ובשירות אישי. ${site.address.full}. טל׳ ${site.phone}.`;

export const metadata: Metadata = {
  metadataBase: new URL(site.deployUrl),
  title: {
    default: title,
    template: `%s | ${site.name}`,
  },
  description,
  applicationName: site.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: site.name,
  },
  keywords: [
    "חשמל חנקין",
    "Electro Hankin",
    "מוצרי חשמל",
    "מכשירי חשמל",
    "מוצרי חשמל לבית",
    "מוצרים למטבח",
    "מאווררים",
    "מנגלים",
    "מוצרי חורף",
    "חנות חשמל חולון",
    "חשמל חולון",
  ],
  authors: [{ name: site.name }],
  creator: site.name,
  publisher: site.name,
  formatDetection: { telephone: true, address: true, email: true },
  icons: iconsMeta,
  alternates: {
    canonical: "/",
    languages: { "he-IL": "/" },
  },
  openGraph: {
    title,
    description,
    url: site.url,
    siteName: site.name,
    locale: "he_IL",
    type: "website",
    images: [
      {
        url: site.ogImage,
        width: 1200,
        height: 630,
        alt: `${site.name} — ${site.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [site.ogImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  ...(site.googleSiteVerification
    ? { verification: { google: site.googleSiteVerification } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: brandPrimary,
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

function StructuredData() {
  // Reviews shown on the homepage (CustomerVoices) — backs the aggregateRating
  // so the rating markup corresponds to real reviews visible on the page.
  const reviews = (site.reviews ?? []).filter((r) => r && r.text);
  const ratingAvg = reviews.length
    ? reviews.reduce((sum, r) => sum + Number(r.rating ?? 5), 0) / reviews.length
    : 0;

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Store", "LocalBusiness", "Organization", "ElectronicsStore"],
        "@id": `${site.url}/#store`,
        name: site.name,
        alternateName: site.nameEn,
        legalName: site.legalName,
        url: site.url,
        image: `${site.deployUrl}${site.ogImage}`,
        description,
        telephone: site.phone,
        priceRange: "₪₪",
        currenciesAccepted: "ILS",
        paymentAccepted: "מזומן, כרטיס אשראי",
        areaServed: ["חולון", "בת ים", "ראשון לציון", "תל אביב-יפו", "אזור", "רמת גן"].map(
          (name) => ({ "@type": "City", name }),
        ),
        geo: {
          "@type": "GeoCoordinates",
          latitude: 32.0197,
          longitude: 34.7789,
        },
        hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          site.address.full,
        )}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.address.street,
          addressLocality: site.address.city,
          postalCode: site.address.postalCode,
          addressCountry: site.address.country,
        },
        openingHoursSpecification: site.openingHours.map((h) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: h.days,
          opens: h.opens,
          closes: h.closes,
        })),
        contactPoint: {
          "@type": "ContactPoint",
          telephone: site.phone,
          contactType: "customer service",
          areaServed: "IL",
          availableLanguage: ["he"],
        },
        sameAs: [site.facebook, site.instagram].filter(Boolean),
        ...(reviews.length
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: Number(ratingAvg.toFixed(1)),
                reviewCount: reviews.length,
                bestRating: 5,
                worstRating: 1,
              },
              review: reviews.map((r) => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.author },
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: Number(r.rating ?? 5),
                  bestRating: 5,
                  worstRating: 1,
                },
                reviewBody: r.text,
              })),
            }
          : {}),
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        inLanguage: "he-IL",
        publisher: { "@id": `${site.url}/#store` },
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={heebo.variable}
      style={
        {
          "--color-brand-red": brandPrimary,
          "--color-brand-red-dark": brandPrimaryDark,
        } as React.CSSProperties
      }
    >
      <body className="overflow-x-hidden">
        <a href="#main-content" className="skip-link">
          דלג לתוכן
        </a>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(!matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-gsap-anim','')}}catch(e){}",
          }}
        />
        <ScrollToTop />
        <PWARegister />
        <ScrollReveal />
        <StructuredData />
        <CartProvider>
          <WishlistProvider>
            <QuickViewProvider>
              <ConditionalChrome
                header={<SiteHeader />}
                footer={<SiteFooter />}
              >
                {children}
              </ConditionalChrome>
              <InstallPrompt />
              <QuickViewModal />
              <AccessibilityWidget />
            </QuickViewProvider>
          </WishlistProvider>
        </CartProvider>
      </body>
    </html>
  );
}
