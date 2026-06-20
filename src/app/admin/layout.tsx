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

const ADMIN_HOST_GUARD = `(function(){try{var swa="jolly-bush-07bb10a03.7.azurestaticapps.net";var h=location.hostname;if(h!==swa&&h!=="localhost"&&h!=="127.0.0.1"){location.replace("https://"+swa+"/admin/"+location.search+location.hash);}}catch(e){}})();`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ADMIN_HOST_GUARD }} />
      {children}
    </>
  );
}
