// src/features/mypage/hooks/useUpdateProfile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile } from "../api/myPageApi";

export function useUpdateProfile() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: updateProfile,
        onSuccess: () => {
            // 캐시 무효화하여 화면 갱신 유도
            queryClient.invalidateQueries({ queryKey: ["my", "profile"] });
            queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
    });
}
