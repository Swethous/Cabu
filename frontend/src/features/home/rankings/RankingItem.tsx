"use client";

import Link from "next/link";
import { Flame } from "lucide-react";
import styles from "./RankingItem.module.css";
import type { RankingItem as RankingItemType } from "./api/rankingApi.client";

type Props = {
    item: RankingItemType;
};

export default function RankingItem({ item }: Props) {
    const isPlus = (item.change_percent ?? 0) >= 0;

    // Fix: score가 null인 경우도 체크해야 함 (undefined뿐만 아니라)
    // null != null은 false, undefined != null은 false
    const isPopular = item.score != null;

    return (
        <Link href={`/stocks/${item.symbol}`} scroll prefetch={false} className={styles.item}>
            <div className={styles.rankCol}>
                <span className={`${styles.rank} ${item.rank <= 3 ? styles.topRank : ""}`}>
                    {item.rank}
                </span>
            </div>

            <div className={styles.infoCol}>
                <div className={styles.name}>{item.name_jp || item.name}</div>
                <div className={styles.symbol}>{item.symbol}</div>
            </div>

            <div className={styles.priceCol}>
                <div className={styles.price}>
                    {item.price?.toLocaleString("en-US")}
                </div>

                {isPopular ? (
                    <div className={styles.score}>
                        <Flame size={12} />
                        {item.score?.toLocaleString("en-US")}
                    </div>
                ) : (
                    <div className={`${styles.change} ${isPlus ? styles.up : styles.down}`}>
                        {isPlus ? "+" : ""}{item.change_percent?.toFixed(2)}%
                    </div>
                )}
            </div>
        </Link>
    );
}
