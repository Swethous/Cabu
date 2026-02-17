"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deleteCommunityComment } from "../api/communityApi.client";
import { communityKeys } from "../api/queryKeys";
import type { CommentsResponse } from "../types";

function removeCommentFromInfinite(
  old: InfiniteData<CommentsResponse> | undefined,
  commentId: number
): InfiniteData<CommentsResponse> | undefined {
  if (!old) return old;

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: (page.data ?? []).filter((c) => c.id !== commentId),
    })),
  };
}

export function useDeleteCommunityComment(post_id: number) {
  const qc = useQueryClient();
  const key = communityKeys.commentsByPostId(post_id);

  return useMutation({
    mutationFn: (vars: { comment_id: number }) => deleteCommunityComment(vars),

    onMutate: async ({ comment_id }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<InfiniteData<CommentsResponse>>(key);

      qc.setQueryData<InfiniteData<CommentsResponse>>(key, (old) =>
        removeCommentFromInfinite(old, comment_id)
      );

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(key, ctx.previous);
    },

    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: key });
    },
  });
}