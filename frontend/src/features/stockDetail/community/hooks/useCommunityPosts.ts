// "use client";

// import { useQuery } from "@tanstack/react-query";
// import { communityKeys } from "../api/queryKeys";
// import { getCommunityPosts } from "../api/communityApi.client";
// import type { PostsResponse } from "../types";

// export function useCommunityPosts(symbol: string) {
//   return useQuery<PostsResponse, Error>({
//     queryKey: communityKeys.posts(symbol),
//     queryFn: () => getCommunityPosts(symbol),

//     // 커뮤니티는 최신성이 중요하니까 기본은 이렇게:
//     staleTime: 0,
//     refetchOnWindowFocus: true,
//   });
// }