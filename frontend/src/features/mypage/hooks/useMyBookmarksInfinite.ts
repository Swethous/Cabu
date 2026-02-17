import { useInfiniteQuery } from "@tanstack/react-query";
import { getMyBookmarks } from "../api/myPageApi";

export function useMyBookmarksInfinite() {
  return useInfiniteQuery({
    queryKey: ["my", "bookmarks"],
    queryFn: ({ pageParam }) => getMyBookmarks({ cursor: pageParam ?? null, limit: 20 }),
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
