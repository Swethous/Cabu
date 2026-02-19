"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Flame,
  Landmark,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { getRankings } from "./api/rankingApi.client";
import styles from "./RankingMiniSidebar.module.css";

type Category = "popular" | "market_cap" | "gainers" | "losers";
type Market = "US" | "JP";

export default function RankingMiniSidebar({ currentSymbol }: { currentSymbol: string }) {
  const [category, setCategory] = useState<Category>("popular");
  const [market, setMarket] = useState<Market>("JP");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rankings", "mini", 8],
    queryFn: () => getRankings(8),
    staleTime: 1000 * 60 * 10,
  });

  const list = useMemo(() => {
    const rankings = data?.rankings ?? {};
    if (category === "popular") return rankings.popular ?? [];
    return rankings[`${market}:${category}`] ?? [];
  }, [data, category, market]);

  return (
    <section className={styles.panel}>
      <header className={styles.header}>
        <h3 className={styles.title}>人気ランキング</h3>
        <span className={styles.badge}>TOP 8</span>
      </header>

      <div className={styles.controls}>
        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${category === "popular" ? styles.activeTab : ""}`}
            onClick={() => setCategory("popular")}
          >
            <Flame size={12} />
            人気
          </button>
          <button
            type="button"
            className={`${styles.tab} ${category === "gainers" ? styles.activeTab : ""}`}
            onClick={() => setCategory("gainers")}
          >
            <TrendingUp size={12} />
            急騰
          </button>
          <button
            type="button"
            className={`${styles.tab} ${category === "losers" ? styles.activeTab : ""}`}
            onClick={() => setCategory("losers")}
          >
            <TrendingDown size={12} />
            急落
          </button>
          <button
            type="button"
            className={`${styles.tab} ${category === "market_cap" ? styles.activeTab : ""}`}
            onClick={() => setCategory("market_cap")}
          >
            <Landmark size={12} />
            時価総額
          </button>
        </div>

        {category !== "popular" && (
          <div className={styles.marketToggle}>
            <button
              type="button"
              className={`${styles.marketBtn} ${market === "JP" ? styles.activeMarket : ""}`}
              onClick={() => setMarket("JP")}
            >
              日本
            </button>
            <button
              type="button"
              className={`${styles.marketBtn} ${market === "US" ? styles.activeMarket : ""}`}
              onClick={() => setMarket("US")}
            >
              米国
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className={styles.state}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      )}

      {isError && !isLoading && (
        <div className={styles.stateText}>ランキングを取得できませんでした。</div>
      )}

      {!isLoading && !isError && list.length === 0 && (
        <div className={styles.stateText}>表示できるデータがありません。</div>
      )}

      {!isLoading && !isError && list.length > 0 && (
        <div className={styles.list}>
          {list.map((item) => {
            const active = item.symbol.toUpperCase() === currentSymbol.toUpperCase();
            return (
              <Link
                key={`mini-ranking-${item.id}`}
                href={`/stocks/${item.symbol}`}
                scroll
                prefetch={false}
                className={`${styles.item} ${active ? styles.active : ""}`}
              >
                <span className={styles.rank}>{item.rank}</span>

                <div className={styles.info}>
                  <div className={styles.name}>{item.name_jp || item.name}</div>
                  <div className={styles.symbol}>{item.symbol}</div>
                </div>

                <div className={styles.metric}>
                  {item.score != null ? (
                    <span className={styles.score}>
                      <Flame size={12} />
                      {item.score.toLocaleString("en-US")}
                    </span>
                  ) : item.change_percent != null ? (
                    <span className={item.change_percent >= 0 ? styles.up : styles.down}>
                      {item.change_percent >= 0 ? "+" : ""}
                      {item.change_percent.toFixed(2)}%
                    </span>
                  ) : (
                    <span className={styles.price}>{item.price?.toLocaleString("en-US") ?? "-"}</span>
                  )}
                </div>

                <ChevronRight size={14} className={styles.arrow} />
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
