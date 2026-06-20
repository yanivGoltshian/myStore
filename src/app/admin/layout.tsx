import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ניהול · חשמל חנקין",
  applicationName: "ניהול · חשמל חנקין",
  manifest: "/admin.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ניהול חשמל חנקין",
  },
  icons: {
    apple: [{ url: "/admin-apple-icon.png", sizes: "180x180" }],
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
