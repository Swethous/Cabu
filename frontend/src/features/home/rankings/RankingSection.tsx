"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Landmark, TrendingDown, TrendingUp } from "lucide-react";
import { getRankings } from "./api/rankingApi.client";
import RankingItem from "./RankingItem";
import styles from "./RankingSection.module.css";

type Category = "popular" | "market_cap" | "gainers" | "losers";
type Market = "US" | "JP";

export default function RankingSection() {
    const [category, setCategory] = useState<Category>("popular");
    const [market, setMarket] = useState<Market>("JP");

    const { data, isLoading } = useQuery({
        queryKey: ["rankings"], // simple key for now
        queryFn: () => getRankings(),
        staleTime: 1000 * 60 * 10, // 10 minutes
    });

    const rankings = data?.rankings || {};

    const getList = () => {
        if (category === "popular") {
            return rankings["popular"] || [];
        }
        const key = `${market}:${category}`;
        return rankings[key] || [];
    };

    const list = getList();
    const showMarketToggle = category !== "popular";

    return (
        <section className={styles.section}>
            <header className={styles.header}>
                <div>
                    <h2 className={styles.title}>ランキング</h2>
                    <p className={styles.subtitle}>話題の銘柄と値動きをまとめて確認</p>
                </div>

                {/* Market Toggle (only if not popular) */}
                {showMarketToggle && (
                    <div className={styles.marketToggle}>
                        <button
                            type="button"
                            className={`${styles.marketBtn} ${market === "US" ? styles.activeMarket : ""}`}
                            onClick={() => setMarket("US")}
                        >
                            米国
                        </button>
                        <button
                            type="button"
                            className={`${styles.marketBtn} ${market === "JP" ? styles.activeMarket : ""}`}
                            onClick={() => setMarket("JP")}
                        >
                            日本
                        </button>
                    </div>
                )}
            </header>

            {/* Category Tabs */}
            <div className={styles.tabs}>
                <button
                    type="button"
                    className={`${styles.tab} ${category === "popular" ? styles.activeTab : ""}`}
                    onClick={() => setCategory("popular")}
                >
                    <Flame size={14} />
                    人気
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${category === "gainers" ? styles.activeTab : ""}`}
                    onClick={() => setCategory("gainers")}
                >
                    <TrendingUp size={14} />
                    急上昇
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${category === "losers" ? styles.activeTab : ""}`}
                    onClick={() => setCategory("losers")}
                >
                    <TrendingDown size={14} />
                    急下落
                </button>
                <button
                    type="button"
                    className={`${styles.tab} ${category === "market_cap" ? styles.activeTab : ""}`}
                    onClick={() => setCategory("market_cap")}
                >
                    <Landmark size={14} />
                    時価総額
                </button>
            </div>

            <div className={styles.content}>
                {isLoading && (
                    <>
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className={styles.skeleton}>
                                <div className={styles.skeletonRank} />
                                <div className={styles.skeletonInfo}>
                                    <div className={styles.skeletonName} />
                                    <div className={styles.skeletonSymbol} />
                                </div>
                                <div className={styles.skeletonPrice}>
                                    <div className={styles.skeletonPriceValue} />
                                    <div className={styles.skeletonChange} />
                                </div>
                            </div>
                        ))}
                    </>
                )}

                {!isLoading && list.length === 0 && (
                    <div className={styles.empty}>表示できるデータがありません。</div>
                )}

                {!isLoading && list.map((item) => (
                    <RankingItem key={`${category}-${item.id}`} item={item} />
                ))}
            </div>
        </section>
    );
}
