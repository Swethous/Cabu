import { apiFetch } from "@/lib/apiClient";
import type { CommentsResponse, PostLikeResponse, PostsResponse } from "../types";

// list
export function getCommunityPosts(params: {
  symbol: string;
  cursor?: string | null;
  limit?: number;
}) {
  const { symbol, cursor, limit = 20 } = params;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (cursor) qs.set("cursor", cursor);

  return apiFetch<PostsResponse>(
    `/api/stocks/${encodeURIComponent(symbol)}/posts?${qs.toString()}`,
    { method: "GET" }
  );
}

export function getCommunityComments(params: {
  post_id: number;
  cursor?: string | null;
  limit?: number;
}) {
  const { post_id, cursor, limit = 5 } = params;

  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (cursor) qs.set("cursor", cursor);

  return apiFetch<CommentsResponse>(
    `/api/posts/${encodeURIComponent(String(post_id))}/comments?${qs.toString()}`,
    { method: "GET" }
  );
}

// create
export function createCommunityPost(params: {
  symbol: string;
  body: string;
  imageUrl?: string | null;
}) {
  const { symbol, body, imageUrl = null } = params;

  return apiFetch<void>(
    `/api/stocks/${encodeURIComponent(symbol)}/posts`,
    {
      method: "POST",
      body: JSON.stringify({ body, imageUrl }),
    }
  );
}

export function createCommunityComment(params: {
  post_id: number;
  body: string
}) {
  const { post_id, body } = params;

  return apiFetch<Comment>(
    `/api/posts/${encodeURIComponent(String(post_id))}/comments`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    }
  );
}


// update
export function updateCommunityPost(params: {
  post_id: number;
  body: string;
  imageUrl?: string | null;
}) {
  const { post_id, body, imageUrl = null } = params;

  return apiFetch<void>(
    `/api/posts/${encodeURIComponent(String(post_id))}`,
    {
      method: "PATCH",
      body: JSON.stringify({ body, imageUrl }),
    }
  );
}

export function updateCommunityComment(params: {
  comment_id: number;
  body: string;
}) {
  const { comment_id, body } = params;

  return apiFetch<void>(
    `/api/comments/${encodeURIComponent(String(comment_id))}`,
    {
      method: "PATCH",
      body: JSON.stringify({ body }),
    }
  )
}

// delete
export function deleteCommunityPost(params: {
  post_id: number;
}) {
  const { post_id } = params;

  return apiFetch<void>(
    `/api/posts/${encodeURIComponent(String(post_id))}`,
    { method: "DELETE" }
  );
}

export function deleteCommunityComment(params: {
  comment_id: number;
}) {
  const { comment_id } = params;

  return apiFetch<void>(
    `/api/comments/${encodeURIComponent(String(comment_id))}`,
    { method: "DELETE" }
  );
}


// like
export function postPostLike(params: { post_id: number }) {
  const { post_id } = params;

  return apiFetch<void>(
    `/api/posts/${encodeURIComponent(String(post_id))}/like`,
    { method: "POST" }
  );
}

export function deletePostLike(params: { post_id: number}) {
  const { post_id } = params;

  return apiFetch<void>(
    `/api/posts/${encodeURIComponent(String(post_id))}/like`,
    { method: "DELETE" }
  )
}

export function postCommentLike(params: { comment_id: number }) {
  const { comment_id } = params;

  return apiFetch<void>(
    `/api/comments/${encodeURIComponent(String(comment_id))}/like`,
    { method: "POST" }
  );
}

export function deleteCommentLike(params: { comment_id: number}) {
  const { comment_id } = params;

  return apiFetch<void>(
    `/api/comments/${encodeURIComponent(String(comment_id))}/like`,
    { method: "DELETE" }
  )
}

