"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "./Header";
import ProfileDrawer from "./ProfileDrawer";
import styles from "./AppShell.module.css";

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

      <div className={styles.AppContent}>{children}</div>
    </div>
  );
}
