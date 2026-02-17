// src/features/mypage/hooks/useMyPostsInfinite.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyPosts } from "../api/myPageApi";

export function useMyPostsInfinite() {
  return useInfiniteQuery({
    queryKey: ["my", "posts"],
    queryFn: ({ pageParam }) => getMyPosts({ cursor: pageParam ?? null, limit: 20 }),
    initialPageParam: null as string | null,

    // ✅ next_cursor 안전 처리 (null/undefined/"" 모두 종료로)
    getNextPageParam: (lastPage) => {
      const c = lastPage?.meta?.next_cursor;
      return c ? c : undefined;
    },

    // ✅ 부하/폭주 방지
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
}