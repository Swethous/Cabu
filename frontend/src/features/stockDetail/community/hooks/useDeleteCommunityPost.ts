"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deleteCommunityPost } from "../api/communityApi.client";
import { communityKeys } from "../api/queryKeys";
import type { PostsResponse } from "../types";

function removePostFromInfinite(
  old: InfiniteData<PostsResponse> | undefined,
  postId: number
): InfiniteData<PostsResponse> | undefined {
  if (!old) return old;

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: (page.data ?? []).filter((p) => p.id !== postId),
    })),
  };
}

export function useDeleteCommunityPost(symbol: string) {
  const qc = useQueryClient();
  const key = communityKeys.postsBySymbol(symbol);

  return useMutation({
    mutationFn: (vars: { post_id: number }) => deleteCommunityPost(vars),

    onMutate: async ({ post_id }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<InfiniteData<PostsResponse>>(key);

      // ✅ optimistic remove
      qc.setQueryData<InfiniteData<PostsResponse>>(key, (old) =>
        removePostFromInfinite(old, post_id)
      );

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      // ✅ rollback
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },

    onSettled: async () => {
      // ✅ server truth로 맞추기
      await qc.invalidateQueries({ queryKey: key });
    },
  });
}