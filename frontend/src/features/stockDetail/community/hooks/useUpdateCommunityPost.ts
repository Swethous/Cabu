"use client";

import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { updateCommunityPost } from "../api/communityApi.client";
import { communityKeys } from "../api/queryKeys";
import type { PostsResponse } from "../types";

type Vars = { post_id: number; body: string; imageUrl?: string | null };

function updatePostInInfinite(
  old: InfiniteData<PostsResponse> | undefined,
  vars: Vars
): InfiniteData<PostsResponse> | undefined {
  if (!old) return old;

  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      data: (page.data ?? []).map((p) => {
        if (p.id !== vars.post_id) return p;

        const nextBody = vars.body;
        const nextPreview = nextBody.toString().slice(0, 120); // truncate는 서버랑 다를 수 있음(OK)

        return {
          ...p,
          body: nextBody,
          preview: nextPreview,
          image_url: vars.imageUrl ?? p.image_url,
        };
      }),
    })),
  };
}

export function useUpdateCommunityPost(symbol: string) {
  const qc = useQueryClient();
  const key = communityKeys.postsBySymbol(symbol);

  return useMutation({
    mutationFn: (vars: Vars) => updateCommunityPost(vars),

    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<InfiniteData<PostsResponse>>(key);

      qc.setQueryData<InfiniteData<PostsResponse>>(key, (old) =>
        updatePostInInfinite(old, vars)
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