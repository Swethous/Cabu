// src/features/mypage/types.ts
import { Post, CursorMeta } from "../stockDetail/community/types";

export type MyProfile = {
    id: number;
    email: string;
    name: string;
    avatar_url: string | null;
    created_at: string;
    stats: {
        posts_count: number;
        received_likes_count: number;
    };
};

export type MyProfileResponse = {
    user: MyProfile;
};

export type MyPost = {
    id: number;
    stock: {
        symbol: string;
        name: string;
        name_jp: string | null;
    };
    body: string;
    likes_count: number;
    comments_count: number;
    created_at: string;
};

export type LikedPost = Post & {
    liked_by_me: true;
    stock: {
        symbol: string;
        name: string;
        name_jp: string | null;
    };
};

export type MyPostsResponse = {
    data: MyPost[];
    meta: CursorMeta;
};

export type LikedPostsResponse = {
    data: LikedPost[];
    meta: CursorMeta;
};

export type BookmarkItem = {
    id: number;
    bookmarked_at: string;
    stock: {
        id: number;
        symbol: string;
        name: string | null;
        name_jp: string | null;
        market: string | null;
        currency: string | null;
    };
};

export type BookmarksResponse = {
    data: BookmarkItem[];
    meta: CursorMeta;
};
