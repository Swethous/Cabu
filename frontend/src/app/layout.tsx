import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "./components/layout/AppShell";
import QueryProvider from "./providers";
import { ToasterProvider } from "@/contexts/ToasterProvider";
import { getSiteUrl } from "@/lib/seo";
import ogDefaultImage from "@/assets/og/og-default.png";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const defaultTitle = "Cabu | 株式コミュニティ";
const defaultDescription =
  "米国株・日本株の株価チャートと投資家コミュニティを1画面で確認できる株式コミュニティサービス。";
const defaultOgImage = {
  url: ogDefaultImage.src,
  width: 1200,
  height: 630,
  alt: "Cabu 株式コミュニティ",
};

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  applicationName: "Cabu",
  title: {
    default: defaultTitle,
    template: "%s | Cabu",
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon-20260221.ico" },
      { url: "/favicon.ico" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "Cabu",
    title: defaultTitle,
    description: defaultDescription,
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [defaultOgImage.url],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={notoSansJp.className} suppressHydrationWarning>
        <QueryProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </QueryProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
