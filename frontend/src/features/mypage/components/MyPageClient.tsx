// src/features/mypage/components/MyPageClient.tsx
"use client";

import { useState } from "react";
import ProfileSection from "./ProfileSection";
import MyPostsTab from "./MyPostsTab";
import LikedPostsTab from "./LikedPostsTab";
import { useMyProfile } from "../hooks/useMyProfile";
import styles from "./MyPageClient.module.css";

type Tab = "posts" | "liked";

export default function MyPageClient() {
  const { data: profile, isLoading, isError } = useMyProfile();
  const [activeTab, setActiveTab] = useState<Tab>("posts");

  if (isLoading) return <div className={styles.loading}>プロフィールを読み込み中...</div>;
  if (isError || !profile)
    return <div className={styles.error}>プロフィールの読み込みに失敗しました。ログインしてください。</div>;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>マイページ</h1>
            <p className={styles.subtitle}>プロフィールと投稿履歴を確認できます</p>
          </div>
          <span className={styles.countBadge}>投稿 {profile.stats?.posts_count ?? 0} 件</span>
        </div>
      </div>

      <div className={styles.content}>
        <ProfileSection profile={profile} />

        <div className={styles.tabsContainer}>
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${activeTab === "posts" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("posts")}
            >
              投稿
            </button>

            <button
              type="button"
              className={`${styles.tab} ${activeTab === "liked" ? styles.activeTab : ""}`}
              onClick={() => setActiveTab("liked")}
            >
              いいね
            </button>
          </div>
        </div>

        {activeTab === "posts" ? <MyPostsTab /> : <LikedPostsTab />}
      </div>
    </div>
  );
}
