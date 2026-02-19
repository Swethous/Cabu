"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, type MouseEvent } from "react";
import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useMyBookmarksInfinite } from "@/features/mypage/hooks/useMyBookmarksInfinite";
import { deleteStockBookmark } from "@/features/stockDetail/bookmark/api/bookmarkApi.client";
import type { BookmarksResponse } from "@/features/mypage/types";
import styles from "./BookmarksPageClient.module.css";

export default function BookmarksPageClient() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMyBookmarksInfinite();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const removeBookmark = useMutation({
    mutationFn: (symbol: string) => deleteStockBookmark(symbol),

    onMutate: async (symbol) => {
      await queryClient.cancelQueries({ queryKey: ["my", "bookmarks"] });

      const previous = queryClient.getQueryData<InfiniteData<BookmarksResponse>>([
        "my",
        "bookmarks",
      ]);

      queryClient.setQueryData<InfiniteData<BookmarksResponse>>(
        ["my", "bookmarks"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: (page.data ?? []).filter((item) => item.stock.symbol !== symbol),
            })),
          };
        }
      );

      queryClient.setQueryData(["stock", "bookmark", symbol], {
        symbol,
        bookmarked: false,
      });

      return { previous, symbol };
    },

    onError: (_err, _symbol, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(["my", "bookmarks"], ctx.previous);
      }
      toast.error("ブックマーク解除に失敗しました。");
    },

    onSettled: async (_data, _error, symbol) => {
      await queryClient.invalidateQueries({ queryKey: ["my", "bookmarks"] });
      await queryClient.invalidateQueries({ queryKey: ["stock", "bookmark", symbol] });
    },
  });

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
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const bookmarks = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const onClickUnbookmark = (e: MouseEvent<HTMLButtonElement>, symbol: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (removeBookmark.isPending) return;
    removeBookmark.mutate(symbol);
  };

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.titleRow}>
          <div className={styles.titleWrap}>
            <span className={styles.iconCircle}>
              <Star size={15} strokeWidth={2.2} fill="currentColor" />
            </span>
            <div>
              <h1 className={styles.title}>ブックマーク</h1>
              <p className={styles.subtitle}>気になる銘柄をまとめて確認できます</p>
            </div>
          </div>
          <span className={styles.countBadge}>{bookmarks.length} 件</span>
        </div>
      </div>

      <div className={styles.content}>
        {isLoading && <div className={styles.state}>ブックマークを読み込み中...</div>}
        {isError && !isLoading && (
          <div className={styles.state}>ブックマークの読み込みに失敗しました。ログインしてください。</div>
        )}
        {!isLoading && !isError && bookmarks.length === 0 && (
          <div className={styles.state}>まだブックマークはありません。</div>
        )}

        {!isLoading && !isError && bookmarks.length > 0 && (
          <div className={styles.list}>
            {bookmarks.map((item) => {
              const displayName = item.stock.name_jp || item.stock.name || item.stock.symbol;
              const marketLine = [item.stock.market, item.stock.currency].filter(Boolean).join(" ・ ");

              return (
                <Link
                  key={item.id}
                  href={`/stocks/${item.stock.symbol}`}
                  prefetch={false}
                  className={styles.card}
                >
                  <div className={styles.cardHeader}>
                    <span className={styles.stockLabel}>{item.stock.symbol}</span>
                    <div className={styles.cardHeaderRight}>
                      <span className={styles.date}>保存日 {fmt.format(new Date(item.bookmarked_at))}</span>
                      <button
                        type="button"
                        className={styles.unbookmarkButton}
                        onClick={(e) => onClickUnbookmark(e, item.stock.symbol)}
                        aria-label="ブックマークを解除"
                        disabled={removeBookmark.isPending}
                      >
                        <Star size={14} strokeWidth={2.2} fill="currentColor" />
                      </button>
                    </div>
                  </div>

                  <p className={styles.name}>{displayName}</p>
                  <p className={styles.meta}>{marketLine || "詳細を見る"}</p>
                </Link>
              );
            })}

            <div ref={sentinelRef} className={styles.sentinel} />
            {isFetchingNextPage && <div className={styles.state}>さらに読み込み中...</div>}
          </div>
        )}
      </div>
    </div>
  );
}
