// app/stocks/[symbol]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ChartSection from "@/features/stockDetail/chart/components/ChartSection.client";
import CommunitySection from "@/features/stockDetail/community/components/CommunitySection.client";
import RankingMiniSidebar from "@/features/home/rankings/RankingMiniSidebar";

import { fetchStockChart } from "@/features/stockDetail/chart/api/stockChartApi.server";
import type { Interval, Period, Mode } from "@/features/stockDetail/chart/api/types";
import { periodToMode } from "@/features/stockDetail/chart/utils/period";
import styles from "./page.module.css";

type PageProps = {
  params: Promise<{ symbol?: string }>;
  searchParams?: Promise<{ period?: string; interval?: string }>;
};

const normalizeSymbol = (raw: string) => {
  try {
    return decodeURIComponent(raw).toUpperCase();
  } catch {
    return raw.toUpperCase();
  }
};

const buildStockMetadata = (symbol: string, displayName?: string | null): Metadata => {
  const normalizedDisplayName = displayName?.trim();
  const title =
    normalizedDisplayName && normalizedDisplayName.toUpperCase() !== symbol
      ? `${normalizedDisplayName} (${symbol}) 株価チャート・掲示板`
      : `${symbol} 株価チャート・掲示板`;
  const description = `${
    normalizedDisplayName || symbol
  }の株価チャート、出来高、コミュニティ投稿を確認できます。`;
  const canonicalPath = `/stocks/${encodeURIComponent(symbol)}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "website",
      url: canonicalPath,
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
};

export async function generateMetadata({ params }: Pick<PageProps, "params">): Promise<Metadata> {
  const { symbol: raw } = await params;
  if (!raw) {
    return {
      title: "銘柄詳細",
      description: "銘柄の株価チャートとコミュニティ投稿を確認できます。",
    };
  }

  const symbol = normalizeSymbol(raw);

  try {
    const data = await fetchStockChart({ symbol, mode: "daily" });
    const displayName = data.displayLabel ?? data.metaName?.long ?? data.metaName?.short ?? symbol;
    return buildStockMetadata(symbol, displayName);
  } catch {
    return buildStockMetadata(symbol);
  }
}

const isPeriod = (v: unknown): v is Period =>
  v === "day" || v === "week" || v === "month" || v === "year";

const isInterval = (v: unknown): v is Interval =>
  v === "5m" || v === "15m" || v === "30m" || v === "60m";

export default async function Page({ params, searchParams }: PageProps) {
  const { symbol: raw } = await params;
  const sp = (await searchParams) ?? {};
  if (!raw) notFound();

  const symbol = normalizeSymbol(raw);

  const period: Period = isPeriod(sp.period) ? sp.period : "day";
  const interval: Interval | undefined = isInterval(sp.interval) ? sp.interval : undefined;
  const mode: Mode = interval ? "intraday" : periodToMode[period];

  const data = await fetchStockChart({
    symbol,
    mode,
    interval: mode === "intraday" ? interval : undefined,
  });

  return (
    <main className={styles.page}>
      <div className={styles.mainGrid}>
        <div className={styles.leftColumn}>
          <section aria-label="Chart" style={{ minWidth: 0 }}>
            <ChartSection
              symbol={symbol}
              mode={mode}
              period={period}
              interval={interval}
              displayLabel={data.displayLabel ?? data.metaName?.long ?? symbol}
              currency={data.metaMarket?.currency ?? "USD"}
              exchangeTz={data.metaMarket?.exchangeTimezoneName}
              candles={data.candles}
              volumes={data.volumes}
            />
          </section>

          <section aria-label="Community">
            <CommunitySection symbol={symbol} />
          </section>
        </div>

        <aside className={styles.aside} aria-label="Ranking">
          <RankingMiniSidebar currentSymbol={symbol} />
        </aside>
      </div>
    </main>
  );
}
