// src/features/mypage/api/myPageApi.ts
import { apiFetch } from "@/lib/apiClient";
import { MyProfileResponse, MyPostsResponse, LikedPostsResponse, BookmarksResponse } from "../types";

export async function getMyProfile() {
    const data = await apiFetch<MyProfileResponse>("/api/mypage/profile", { method: "GET" });
    return data.user;
}

export function getMyPosts(params: { cursor?: string | null; limit?: number }) {
    const { cursor, limit = 20 } = params;
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    if (cursor) qs.set("cursor", cursor);

    return apiFetch<MyPostsResponse>(`/api/mypage/posts?${qs.toString()}`, {
        method: "GET",
    });
}

export function getLikedPosts(params: { cursor?: string | null; limit?: number }) {
    const { cursor, limit = 20 } = params;
    const qs = new URLSearchParams();
    qs.set("limit", String(limit));
    if (cursor) qs.set("cursor", cursor);

    return apiFetch<LikedPostsResponse>(`/api/mypage/liked_posts?${qs.toString()}`, {
        method: "GET",
    });
}

export function getMyBookmarks(params: { cursor?: string | null; limit?: number }) {
  const { cursor, limit = 20 } = params;
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (cursor) qs.set("cursor", cursor);

  return apiFetch<BookmarksResponse>(`/api/mypage/bookmarks?${qs.toString()}`, {
    method: "GET",
  });
}

export async function updateProfile(params: { name: string; avatarUrl: string | null }) {
  const data = await apiFetch<MyProfileResponse>("/api/mypage/profile", {
    method: "PATCH",
    body: JSON.stringify(params),
  });
  return data.user;
}
