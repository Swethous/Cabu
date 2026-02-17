"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { communityKeys } from "../api/queryKeys";
import { getCommunityPosts } from "../api/communityApi.client";
import type { PostsResponse } from "../types";

export function useCommunityPostsInfinite(symbol: string) {
  return useInfiniteQuery<PostsResponse, Error>({
    queryKey: communityKeys.postsBySymbol(symbol),
    queryFn: ({ pageParam }) => getCommunityPosts({
        symbol,
        limit: 20,
        cursor: (pageParam as string | undefined) ?? undefined,
    }),
    getNextPageParam: (lastPage) => {
        const next = lastPage?.meta.next_cursor;
        return next ? String(next) : undefined;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    initialPageParam: undefined,
  });
}