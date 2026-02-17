// src/features/stockDetail/community/api/queryKeys.ts

export const communityKeys = {
  all: ["community"] as const,
  posts: () => [...communityKeys.all, "posts"] as const,
  postsBySymbol: (symbol: string) => [...communityKeys.posts(), symbol] as const,

  comments: () => [...communityKeys.all, "comments"] as const,
  commentsByPostId: (post_id: number) => [...communityKeys.comments(), post_id] as const,

  indices: () => [...communityKeys.all, "indices"] as const,
}
