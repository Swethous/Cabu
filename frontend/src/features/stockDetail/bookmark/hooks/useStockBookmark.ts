"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteStockBookmark,
  getStockBookmark,
  postStockBookmark,
} from "../api/bookmarkApi.client";
import type { StockBookmarkResponse } from "../types";

export function useStockBookmark(symbol: string, enabled = true) {
  return useQuery({
    queryKey: ["stock", "bookmark", symbol],
    queryFn: () => getStockBookmark(symbol),
    enabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    retry: 1,
  });
}

type ToggleVars = { bookmarked: boolean };

export function useToggleStockBookmark(symbol: string) {
  const queryClient = useQueryClient();
  const key = ["stock", "bookmark", symbol] as const;

  return useMutation({
    mutationFn: ({ bookmarked }: ToggleVars) => {
      return bookmarked ? deleteStockBookmark(symbol) : postStockBookmark(symbol);
    },

    onMutate: async ({ bookmarked }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<StockBookmarkResponse>(key);

      queryClient.setQueryData<StockBookmarkResponse>(key, {
        symbol,
        bookmarked: !bookmarked,
      });

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(key, ctx.previous);
      }
    },

    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: key });
      await queryClient.invalidateQueries({ queryKey: ["my", "bookmarks"] });
    },
  });
}
