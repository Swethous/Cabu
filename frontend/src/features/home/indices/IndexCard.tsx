"use client";

import type { FC } from "react";
import Link from "next/link";
import type { IndexItem } from "./types"
import IndexSparkline from "./IndexSparkline";
import styles from "./IndexCard.module.css";

type Props = { item: IndexItem };

const safeNum = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : 0);

const formatMoney = (n: number, currency: "USD" | "JPY") => {
  const v = safeNum(n);
  const digits = currency === "JPY" ? 0 : 2;

  return v.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

const signed = (n: number, currency: "USD" | "JPY") => {
  const v = safeNum(n);
  const abs = Math.abs(v);
  const s = formatMoney(abs, currency);
  return v >= 0 ? `+${s}` : `-${s}`;
};

const signedPercent = (n: number) => {
  const v = safeNum(n);
  const abs = Math.abs(v).toFixed(2);
  return v >= 0 ? `+${abs}%` : `-${abs}%`;
};

const currencyPrefix = (c: "USD" | "JPY") => (c === "JPY" ? "¥" : "$");

const IndexCard: FC<Props> = ({ item }) => {
  const isUp = safeNum(item.change) >= 0;
  const cur = item.currency;
  const deltaClass = isUp ? styles.upText : styles.downText;

  return (
    <div className={`${styles.IndexCard} ${isUp ? styles.up : styles.down}`}>
      <div className={styles.header}>
        <div className={styles.name}>{item.nameJa || item.nameEn}</div>
        <span className={styles.symbol}>{item.symbol.replace("^", "")}</span>
      </div>

      <div className={styles.price}>
        {currencyPrefix(cur)}
        {formatMoney(item.price, cur)}
      </div>

      <div className={`${styles.delta} ${deltaClass}`}>
        {signed(item.change, cur)} ({signedPercent(item.changePercent)})
      </div>

      <Link
        href={`/stocks/${encodeURIComponent(item.symbol)}`}
        scroll
        className={styles.chartLink}
        aria-label={`${item.symbol} 상세 페이지로 이동`}
      >
        <div className={styles.chartWrap}>
          <IndexSparkline points={item.points} isUp={isUp} />
        </div>
      </Link>
    </div>
  );
};

export default IndexCard;
