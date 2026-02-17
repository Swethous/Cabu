// src/features/mypage/hooks/useLikedPostsInfinite.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { getLikedPosts } from "../api/myPageApi";

export function useLikedPostsInfinite() {
  return useInfiniteQuery({
    queryKey: ["my", "liked_posts"],
    queryFn: ({ pageParam }) => getLikedPosts({ cursor: pageParam ?? null, limit: 20 }),
    initialPageParam: null as string | null,

    getNextPageParam: (lastPage) => {
      const c = lastPage?.meta?.next_cursor;
      return c ? c : undefined;
    },

    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}