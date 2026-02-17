// src/features/stockDetail/community/hooks/useCommunityComments.ts
"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { communityKeys } from "../api/queryKeys";
import type { CommentsResponse } from "../types";
import { getCommunityComments } from "../api/communityApi.client";

// 댓글목록
export function useCommunityComments(post_id: number) {
  return useInfiniteQuery<CommentsResponse, Error>({
    queryKey: communityKeys.commentsByPostId(post_id),
    queryFn: ({ pageParam }) =>
      getCommunityComments({
        post_id,
        limit: 5,
        cursor: (pageParam as string | undefined) ?? undefined,
      }),
    getNextPageParam: (lastPage) => {
      const next = lastPage?.meta?.next_cursor;
      return next ? String(next) : undefined;
    },
    initialPageParam: undefined,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}