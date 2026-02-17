"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createCommunityPost } from "../api/communityApi.client";
import { communityKeys } from "../api/queryKeys";

export function useCreateCommunityPost(symbol: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { body: string; imageUrl?: string | null }) =>
      createCommunityPost({ symbol, ...vars }),

    onSuccess: async () => {
      // 1) 종목 커뮤니티 목록 갱신
      await queryClient.invalidateQueries({ queryKey: communityKeys.postsBySymbol(symbol) });

      // 2) ✅ 마이페이지 '내 글' 목록 갱신
      await queryClient.invalidateQueries({ queryKey: ["my", "posts"] });

      // 3) ✅ 마이페이지 프로필 통계(posts_count 등) 갱신
      await queryClient.invalidateQueries({ queryKey: ["my", "profile"] });

      // (선택) 좋아요 목록도 글 작성이랑 직접 관련은 없지만
      // UX상 같이 갱신하고 싶으면:
      // await queryClient.invalidateQueries({ queryKey: ["my", "liked_posts"] });
    },
  });
}