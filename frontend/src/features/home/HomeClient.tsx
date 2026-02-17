"use client";

import IndexSection from "./indices/IndexSection"
import RankingSection from "./rankings/RankingSection";
import styles from "@/app/page.module.css";

export default function HomeClient() {
  return (
    <main className={styles.main}>
      <IndexSection />
      <RankingSection />
    </main>
  );
}
