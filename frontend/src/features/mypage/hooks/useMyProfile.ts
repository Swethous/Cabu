// useMyProfile.ts
import { useQuery } from "@tanstack/react-query";
import { getMyProfile } from "../api/myPageApi";

export function useMyProfile() {
  return useQuery({
    queryKey: ["my", "profile"],
    queryFn: getMyProfile,
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 0, // ✅ 401이면 재시도 의미 없음(루프 완화)
  });
}