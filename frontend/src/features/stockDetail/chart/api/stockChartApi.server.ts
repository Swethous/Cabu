// src/features/stockDetail/chart/api/stockChartApi.server.ts
import "server-only";
import type { ChartResponse, Interval, Mode } from "./types";

const normalizeBase = (s: string) => s.replace(/\/$/, "");

const getBase = () => {
  const base = process.env.RAILS_API_BASE_URL; // ✅ 서버 전용 (NEXT_PUBLIC 아님)
  if (!base) throw new Error("RAILS_API_BASE_URL is missing");
  return normalizeBase(base);
};

export async function fetchStockChart(params: {
  symbol: string;
  mode: Mode;
  interval?: Interval;
}): Promise<ChartResponse> {
  const { symbol, mode, interval } = params;

  const qs = new URLSearchParams();
  qs.set("mode", mode);
  if (mode === "intraday" && interval) qs.set("interval", interval);

  const url = `${getBase()}/api/v1/stocks/${encodeURIComponent(symbol)}/chart?${qs.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: 300 },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error || `Failed to load chart (${res.status})`;
    throw new Error(msg);
  }

  return data as ChartResponse;
}
