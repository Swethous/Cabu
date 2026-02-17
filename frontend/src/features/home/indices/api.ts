import type { IndexApiItem, IndexItem, IndexPoint } from "./types";
import { apiFetch } from "@/lib/apiClient";

const round = (n: number, digits = 2) => {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
};

const currencyFromSymbol = (symbol: string): "USD" | "JPY" => {
  // 니케이, USDJPY는 JPY 표시
  if (symbol === "^N225") return "JPY";
  if (symbol === "USDJPY=X") return "JPY";
  return "USD";
};

const calcDelta = (points: IndexPoint[]) => {
  if (!points?.length) return { price: 0, change: 0, changePercent: 0 };

  const last = points[points.length - 1]?.close ?? 0;
  const prev = points.length >= 2 ? (points[points.length - 2]?.close ?? last) : last;

  const change = last - prev;
  const changePercent = prev !== 0 ? (change / prev) * 100 : 0;

  return {
    price: round(last, 2),
    change: round(change, 2),
    changePercent: round(changePercent, 2),
  };
};

const mapApiToUi = (api: IndexApiItem): IndexItem => {
  const pts = api.points ?? [];
  const { price, change, changePercent } = calcDelta(pts);

  return {
    id: String(api.id),
    symbol: api.yahoo_symbol,
    nameEn: api.name,
    nameJa: api.name_jp,
    currency: currencyFromSymbol(api.yahoo_symbol),
    price,
    change,
    changePercent,
    points: pts,
  };
};

export async function fetchIndices(): Promise<IndexItem[]> {
  const data = await apiFetch<{ items?: IndexApiItem[] }>("/api/v1/sparklines", {
    method: "GET",
  });

  // ✅ Rails가 { items: [...] } 로 내려주는 형태 기준
  const list: IndexApiItem[] = data?.items ?? [];

  return list.map(mapApiToUi);
}
