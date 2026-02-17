"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIndices } from "./api";
import IndexCard from "./IndexCard";
import styles from "./IndexSection.module.css";
import cardStyles from "./IndexCard.module.css";
import { communityKeys } from "@/features/stockDetail/community/api/queryKeys";

export default function IndexSection() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: communityKeys.indices(),
    queryFn: fetchIndices,
    staleTime: 1000 * 60 * 5,
    select: (data) => (data ?? []).slice(0, 4),
  });

  if (isError) return <div className={styles.state}>指数データの取得に失敗しました: {error?.message}</div>;

  const items = data ?? [];

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>主要指数</h2>
        <span className={styles.badge}>リアルタイム</span>
      </header>

      <div className={styles.grid}>
        {isLoading && (
          <>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={cardStyles.skeleton}>
                <div className={cardStyles.skeletonHeader} />
                <div className={cardStyles.skeletonPrice} />
                <div className={cardStyles.skeletonDelta} />
                <div className={cardStyles.skeletonChart} />
              </div>
            ))}
          </>
        )}

        {!isLoading && items.map((it) => (
          <IndexCard key={it.id} item={it} />
        ))}
      </div>
    </section>
  );
}
