import { apiFetch } from "@/lib/apiClient";
import type { StockBookmarkResponse } from "../types";

export function getStockBookmark(symbol: string) {
  return apiFetch<StockBookmarkResponse>(`/api/stocks/${encodeURIComponent(symbol)}/bookmark`, {
    method: "GET",
  });
}

export function postStockBookmark(symbol: string) {
  return apiFetch<StockBookmarkResponse>(`/api/stocks/${encodeURIComponent(symbol)}/bookmark`, {
    method: "POST",
  });
}

export function deleteStockBookmark(symbol: string) {
  return apiFetch<StockBookmarkResponse>(`/api/stocks/${encodeURIComponent(symbol)}/bookmark`, {
    method: "DELETE",
  });
}
