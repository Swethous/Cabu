"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deleteCommentLike, postCommentLike } from "../api/communityApi.client";
import { communityKeys } from "../api/queryKeys";
import type { CommentsResponse } from "../types";

type Vars = { comment_id: number; liked: boolean };

function updateCommentLikeInInfinite(
  old: InfiniteData<CommentsResponse> | undefined,
  vars: Vars
): InfiniteData<CommentsResponse> | undefined {
  if (!old) return old;

  const { comment_id, liked } = vars;

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: (page.data ?? []).map((c) => {
        if (c.id !== comment_id) return c;

        const nextLiked = !liked;
        const nextLikesCount = Math.max(0, (c.likes_count ?? 0) + (nextLiked ? 1 : -1));

        return {
          ...c,
          liked_by_me: nextLiked,
          likes_count: nextLikesCount,
        };
      }),
    })),
  };
}

export function useToggleCommentLike(post_id: number) {
  const queryClient = useQueryClient();
  const key = communityKeys.commentsByPostId(post_id);

  return useMutation({
    mutationFn: (vars: Vars) => {
      return vars.liked
        ? deleteCommentLike({ comment_id: vars.comment_id })
        : postCommentLike({ comment_id: vars.comment_id });
    },

    // ✅ optimistic 핵심
    onMutate: async (vars) => {
      // 1) 해당 쿼리 refetch 중지 (경합 방지)
      await queryClient.cancelQueries({ queryKey: key });

      // 2) 롤백용 스냅샷 저장
      const previous = queryClient.getQueryData<InfiniteData<CommentsResponse>>(key);

      // 3) 캐시 즉시 업데이트
      queryClient.setQueryData<InfiniteData<CommentsResponse>>(key, (old) =>
        updateCommentLikeInInfinite(old, vars)
      );

      // 4) context로 이전값 반환 → onError에서 롤백
      return { previous };
    },

    // ✅ 실패 시 롤백
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(key, ctx.previous);
      }
    },

    // ✅ 최종 동기화 (권장)
    onSettled: async () => {
      // 서버 쪽 likes_count/liked_by_me가 “진짜 정답”이므로 한번 맞춰줌
      await queryClient.invalidateQueries({ queryKey: key });
    },
  });
}