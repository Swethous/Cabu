// src/features/stockDetail/community/types.ts

export type CommunityUser = {
  id: number;
  name: string;
  avatar_url: string | null;
};

export type Post = {
  id: number;
  stock_id: number;

  preview: string;
  body: string;
  image_url: string | null;

  likes_count: number;
  comments_count: number;

  liked_by_me: boolean;
  editable_by_me: boolean;

  created_at: string; // ISO string
  updated_at: string; // ISO string

  user: CommunityUser;
};

export type Comment = {
  id: number;
  post_id: number;
  body: string;
  likes_count: number;
  liked_by_me: boolean;
  editable_by_me: boolean;
  created_at: string;
  updated_at: string;
  user: CommunityUser;
}

export type CursorMeta = {
  limit: number;
  has_next: boolean;
  next_cursor: string | null;
};

export type PostsResponse = {
  data: Post[];
  meta: CursorMeta;
};

export type CommentsResponse = {
  data: Comment[];
  meta: CursorMeta;
}

// post create request
export type CreatePostRequest = {
  post: {
    body: string;                  // create는 필수
    image_url?: string | null;     // 없을 수도/ null일 수도
  };
};

// post edit request
export type UpdatePostRequest = {
  post: {
    body?: string;                 // 수정할 값만 보낼 수 있게 optional
    image_url?: string | null;     // rails permit과 동일 키
  };
};

// post like
export type PostLikeResponse = {
  post_id: number;
  liked: boolean;
  likes_count: number;
};