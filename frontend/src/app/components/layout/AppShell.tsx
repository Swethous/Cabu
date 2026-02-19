"use client";

import { useEffect, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import styles from "./AppShell.module.css";

const Header = dynamic(() => import("./Header"), { ssr: false });
const ProfileDrawer = dynamic(() => import("./ProfileDrawer"), { ssr: false });

export default function AppShell({ children }: { children: ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <div className={styles.AppLayout} suppressHydrationWarning>
      <Header onMenuClick={() => setIsDrawerOpen(true)} />

      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />

      <main className={styles.AppContent}>{children}</main>
    </div>
  );
}
