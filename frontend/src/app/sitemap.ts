import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

type RankingItem = {
  symbol?: string | null;
};

type RankingsResponse = {
  fetchedAt?: string;
  rankings?: Record<string, RankingItem[]>;
};

const normalizeBase = (url: string) => url.replace(/\/+$/, "");

const getRailsBaseUrl = () => {
  const configured = process.env.RAILS_API_BASE_URL?.trim();
  if (!configured) return null;
  return normalizeBase(configured);
};

async function fetchStockSymbolsFromRankings(): Promise<{
  symbols: string[];
  lastModified?: Date;
}> {
  const base = getRailsBaseUrl();
  if (!base) return { symbols: [] };

  try {
    const res = await fetch(`${base}/api/v1/rankings?limit=50`, {
      next: { revalidate: 1800 },
    });
    if (!res.ok) return { symbols: [] };

    const data = (await res.json()) as RankingsResponse;
    const symbols = Object.values(data.rankings ?? {})
      .flat()
      .map((item) => item.symbol?.trim().toUpperCase())
      .filter((v): v is string => Boolean(v));

    return {
      symbols: [...new Set(symbols)],
      lastModified: data.fetchedAt ? new Date(data.fetchedAt) : undefined,
    };
  } catch {
    return { symbols: [] };
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/").toString(),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: absoluteUrl("/contact").toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const { symbols, lastModified } = await fetchStockSymbolsFromRankings();
  const stockEntries: MetadataRoute.Sitemap = symbols.map((symbol) => ({
    url: absoluteUrl(`/stocks/${encodeURIComponent(symbol)}`).toString(),
    lastModified: lastModified ?? now,
    changeFrequency: "hourly",
    priority: 0.8,
  }));

  return [...staticEntries, ...stockEntries];
}
