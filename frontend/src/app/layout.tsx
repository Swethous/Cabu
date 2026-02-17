import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import AppShell from "./components/layout/AppShell";
import QueryProvider from "./providers";
import { ToasterProvider } from "@/contexts/ToasterProvider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
