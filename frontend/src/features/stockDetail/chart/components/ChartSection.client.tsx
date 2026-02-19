// src/features/stockDetail/chart/components/ChartSection.client.tsx
"use client";
import PeriodTabs from "./PeriodTabs.client";
import IntradayDropdown from "./IntradayDropdown.client";
import StockCandleChart from "./StockCandleChart.client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  useStockBookmark,
  useToggleStockBookmark,
} from "@/features/stockDetail/bookmark/hooks/useStockBookmark";

import type { Candle, Interval, Mode, Period, Volume } from "../api/types";

type Props = {
  symbol: string;
  displayLabel: string;
  currency: string;
  exchangeTz?: string;

  mode: Mode;
  period: Period;
  interval?: Interval;

  candles: Candle[];
  volumes: Volume[];
};

function normalizeDisplayLabel(label: string, symbol: string) {
  const trimmed = label.trim();
  const suffix = trimmed.match(/\s+\(([^)]+)\)\s*$/);
  if (!suffix?.[1]) return trimmed;

  const suffixSymbol = suffix[1].trim().toUpperCase();
  const baseSymbol = symbol.trim().toUpperCase().replace(/^\^/, "");
  const symbolCandidates = new Set([baseSymbol, `^${baseSymbol}`]);

  if (!symbolCandidates.has(suffixSymbol)) return trimmed;
  return trimmed.slice(0, suffix.index).trim();
}

function formatPrice(n: number, currency: string) {
  const digits = currency === "JPY" ? 0 : 2;
  return n.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function ChartSection(props: Props) {
  const { symbol, displayLabel, currency, exchangeTz, mode, period, interval, candles, volumes } = props;
  const normalizedLabel = useMemo(
    () => normalizeDisplayLabel(displayLabel, symbol),
    [displayLabel, symbol]
  );

  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { isLoggedIn, loading } = useAuth();
  const bookmarkQuery = useStockBookmark(symbol, isLoggedIn && !loading);
  const bookmarkToggle = useToggleStockBookmark(symbol);
  const bookmarked = bookmarkQuery.data?.bookmarked ?? false;

  const priceInfo = useMemo(() => {
    const last = candles?.[candles.length - 1];
    const prev = candles?.[candles.length - 2];

    if (!last) return { current: null, diff: null, pct: null, isUp: null };

    const current = last.close;
    if (!prev) return { current, diff: null, pct: null, isUp: null };

    const diff = current - prev.close;
    const pct = prev.close ? (diff / prev.close) * 100 : null;

    return { current, diff, pct, isUp: diff >= 0 };
  }, [candles]);

  const pushQuery = (next: { period?: Period; interval?: Interval }) => {
    const q = new URLSearchParams(sp?.toString());

    if (next.period) q.set("period", next.period);
    if (next.interval) q.set("interval", next.interval);

    // period 바꾸면 분봉 해제
    if (next.period) q.delete("interval");

    // interval 선택하면 period 유지하되 interval만 세팅
    if (next.interval) q.set("interval", next.interval);

    const qs = q.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const onClickBookmark = () => {
    if (loading) return;
    if (!isLoggedIn) {
      toast.error("ログインが必要です。");
      return;
    }
    if (bookmarkToggle.isPending) return;

    bookmarkToggle.mutate({ bookmarked });
  };

  return (
    <section
      style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 12,
        boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
      }}
    >
      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{normalizedLabel}</div>
          <button
            type="button"
            onClick={onClickBookmark}
            aria-label={bookmarked ? "ブックマークを解除" : "ブックマークに追加"}
            disabled={bookmarkToggle.isPending}
            style={{
              width: 32,
              height: 32,
              display: "grid",
              placeItems: "center",
              borderRadius: 10,
              border: bookmarked ? "1px solid #F5D08A" : "1px solid #E5E7EB",
              background: bookmarked ? "#FFF7E6" : "#F8FAFC",
              color: bookmarked ? "#D97706" : "#94A3B8",
              cursor: bookmarkToggle.isPending ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              padding: 0,
            }}
          >
            <Star
              size={17}
              strokeWidth={2.2}
              fill={bookmarked ? "currentColor" : "none"}
            />
          </button>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>
            {priceInfo.current != null ? `${formatPrice(priceInfo.current, currency)} ${currency}` : "-"}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: priceInfo.isUp == null ? "#6B7280" : priceInfo.isUp ? "#F04452" : "#2F6FED",
            }}
          >
            {priceInfo.pct != null ? `${priceInfo.pct.toFixed(2)}%` : "-"}
            {priceInfo.diff != null ? ` (${priceInfo.diff >= 0 ? "+" : ""}${priceInfo.diff.toFixed(2)})` : ""}
          </div>
        </div>
      </div>

      {/* controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 10 }}>
        <PeriodTabs value={period} onChange={(p) => pushQuery({ period: p })} />
        <IntradayDropdown value={interval} onChange={(v) => pushQuery({ interval: v })} />
      </div>

      {/* chart */}
      <div style={{ marginTop: 12 }}>
        <StockCandleChart
          symbol={symbol}
          mode={mode}
          interval={interval}
          candles={candles}
          volumes={volumes}
          exchangeTz={exchangeTz}
        />
      </div>
    </section>
  );
}
