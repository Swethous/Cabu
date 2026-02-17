"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { updateCommunityComment } from "../api/communityApi.client";
import { communityKeys } from "../api/queryKeys";
import type { CommentsResponse } from "../types";

type Vars = { comment_id: number; body: string };

function updateCommentInInfinite(
  old: InfiniteData<CommentsResponse> | undefined,
  vars: Vars
): InfiniteData<CommentsResponse> | undefined {
  if (!old) return old;

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: (page.data ?? []).map((c) =>
        c.id === vars.comment_id ? { ...c, body: vars.body } : c
      ),
    })),
  };
}

//  post_id 단위로 comments queryKey를 잡는 방식 추천

export function useUpdateCommunityComment(postId: number) {
  const qc = useQueryClient();
  const key = communityKeys.commentsByPostId(postId);

  return useMutation({
    mutationFn: (vars: Vars) => updateCommunityComment(vars),

    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<InfiniteData<CommentsResponse>>(key);

      qc.setQueryData<InfiniteData<CommentsResponse>>(key, (old) =>
        updateCommentInInfinite(old, vars)
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