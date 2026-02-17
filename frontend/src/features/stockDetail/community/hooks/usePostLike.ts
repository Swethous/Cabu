"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deletePostLike, postPostLike } from "../api/communityApi.client";
import { communityKeys } from "../api/queryKeys";
import type { PostsResponse } from "../types";

type Vars = { post_id: number; liked: boolean };

function updatePostLikeInInfinite(
  old: InfiniteData<PostsResponse> | undefined,
  vars: Vars
): InfiniteData<PostsResponse> | undefined {
  if (!old) return old;

  const { post_id, liked } = vars;

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: (page.data ?? []).map((p) => {
        if (p.id !== post_id) return p;

        const nextLiked = !liked;
        const nextLikesCount = Math.max(0, (p.likes_count ?? 0) + (nextLiked ? 1 : -1));

        return {
          ...p,
          liked_by_me: nextLiked,
          likes_count: nextLikesCount,
        };
      }),
    })),
  };
}

export function useTogglePostLike(symbol: string) {
  const queryClient = useQueryClient();
  const key = communityKeys.postsBySymbol(symbol);

  return useMutation({
    mutationFn: (vars: Vars) => {
      return vars.liked
        ? deletePostLike({ post_id: vars.post_id })
        : postPostLike({ post_id: vars.post_id });
    },

    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: key });

      const previous = queryClient.getQueryData<InfiniteData<PostsResponse>>(key);

      queryClient.setQueryData<InfiniteData<PostsResponse>>(key, (old) =>
        updatePostLikeInInfinite(old, vars)
      );

      return { previous };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(key, ctx.previous);
      }
    },

    onSettled: async () => {
      // ✅ 커뮤니티 목록은 서버값으로 최종 동기화
      await queryClient.invalidateQueries({ queryKey: key });

      // ✅ 마이페이지 반영 (좋아요 목록/내 글/프로필 통계)
      await queryClient.invalidateQueries({ queryKey: ["my", "liked_posts"] });
      await queryClient.invalidateQueries({ queryKey: ["my", "posts"] });
      await queryClient.invalidateQueries({ queryKey: ["my", "profile"] });
    },
  });
}