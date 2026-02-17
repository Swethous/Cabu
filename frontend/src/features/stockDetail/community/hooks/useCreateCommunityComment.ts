// src/features/stockDetail/community/hooks/useCreateCommunityComment.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { communityKeys } from "../api/queryKeys";
import { createCommunityComment } from "../api/communityApi.client";

export function useCreateCommunityComment(post_id: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (vars: { body: string }) =>
      createCommunityComment({ post_id, body: vars.body }),

    onSuccess: async () => {
      // ✅ B방식: 댓글 목록 다시 불러오기
      await qc.invalidateQueries({ queryKey: communityKeys.commentsByPostId(post_id) });
    },
  });
}