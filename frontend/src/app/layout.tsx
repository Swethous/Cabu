import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "./components/layout/AppShell";
import QueryProvider from "./providers";
import { ToasterProvider } from "@/contexts/ToasterProvider";
import { getSiteUrl } from "@/lib/seo";

const defaultTitle = "Cabu | 株式コミュニティ";
const defaultDescription =
  "米国株・日本株の株価チャートと投資家コミュニティを1画面で確認できる株式コミュニティサービス。";

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
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    siteName: "Cabu",
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body suppressHydrationWarning>
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
