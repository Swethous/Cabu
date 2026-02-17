// src/features/mypage/components/LikedPostsTab.tsx
import { useLikedPostsInfinite } from "../hooks/useLikedPostsInfinite";
import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
import styles from "./TabContent.module.css";

export default function LikedPostsTab() {
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLikedPostsInfinite();

  const sentinelRef = useRef<HTMLDivElement>(null);

  // ✅ 일본 로케일 + 일본 타임존 고정
  const fmt = useMemo(
    () =>
      new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }),
    []
  );

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <div className={styles.loading}>読み込み中...</div>;

  const posts = data?.pages.flatMap((p) => p.data) ?? [];
  if (posts.length === 0) return <div className={styles.empty}>いいねした投稿はまだありません。</div>;

  return (
    <div className={styles.list}>
      {posts.map((post) => (
        <Link key={post.id} href={`/stocks/${post.stock.symbol}`} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.authorInfo}>
              {post.user.avatar_url && (
                <img
                  src={post.user.avatar_url}
                  alt=""
                  className={styles.authorAvatar}
                />
              )}
              <span className={styles.authorName}>{post.user.name}</span>
            </div>

            {/* ✅ suppressHydrationWarning 제거 */}
            <span className={styles.date}>{fmt.format(new Date(post.created_at))}</span>
          </div>

          <p className={styles.body}>{post.body}</p>

          <div className={styles.cardFooter}>
            <span className={styles.stat}>
              <Heart size={14} strokeWidth={2} className={styles.statIcon} />
              {post.likes_count}
            </span>
            <span className={styles.stat}>
              <MessageCircle size={14} strokeWidth={2} className={styles.statIcon} />
              {post.comments_count}
            </span>
          </div>
        </Link>
      ))}

      <div ref={sentinelRef} className={styles.sentinel} />
      {isFetchingNextPage && <div className={styles.loadingMore}>さらに読み込み中...</div>}
    </div>
  );
}
