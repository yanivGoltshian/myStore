import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ConditionalChrome from "@/components/ConditionalChrome";
import ScrollToTop from "@/components/ScrollToTop";
import { CartProvider } from "@/lib/cart";
import { site } from "@/lib/data";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700", "800", "900"],
  variable: "--font-heebo",
  display: "swap",
});

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
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
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
};

function StructuredData() {
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Store", "LocalBusiness", "Organization"],
        "@id": `${site.url}/#store`,
        name: site.name,
        alternateName: site.nameEn,
        legalName: site.legalName,
        url: site.url,
        image: `${site.deployUrl}${site.ogImage}`,
        description,
        telephone: site.phone,
        priceRange: "₪₪",
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
        sameAs: [site.facebook],
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
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>
        <ScrollToTop />
        <StructuredData />
        <CartProvider>
          <ConditionalChrome
            header={<SiteHeader />}
            footer={<SiteFooter />}
          >
            {children}
          </ConditionalChrome>
        </CartProvider>
      </body>
    </html>
  );
}
