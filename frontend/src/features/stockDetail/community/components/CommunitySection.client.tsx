"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./CommunitySection.module.css";
import PostItem from "./PostItem.client";
import { useCommunityPostsInfinite } from "../hooks/useCommunityPostsInfinite";
import NewPostModal from "./NewPostModal.client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useTogglePostLike } from "../hooks/usePostLike";
import EditPostModal from "./EditPostModal.client";
import { Post } from "../types";
import { useDeleteCommunityPost } from "../hooks/useDeleteCommunityPost";
import ConfirmModal from "./ConfirmModal.client";
import { PenSquare } from "lucide-react";

export default function CommunitySection({ symbol }: { symbol: string }) {
  const [hydrated, setHydrated] = useState(false);
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityPostsInfinite(symbol);

  const { isLoggedIn, loading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Post | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);

  const posts = data?.pages.flatMap((p) => p.data ?? []) ?? [];

  const onClickNewPost = () => {
    if (loading) return; // 아직 로딩 중
    if (!isLoggedIn) {
      toast.error("ログインが必要です。");
      return;
    }
    setIsModalOpen(true);
  }

  // post like
  const toggleLike = useTogglePostLike(symbol);
  const [likeBusyId, setLikeBusyId] = useState<number | null>(null);

  const onLike = (postId: number, liked: boolean) => {
    if (loading) return; // 아직 로딩 중
    if (!isLoggedIn) {
      toast.error("ログインが必要です。");
      return;
    }
    if (toggleLike.isPending) return;
    setLikeBusyId(postId);

    toggleLike.mutate(
      { post_id: postId, liked },
      { onSettled: () => setLikeBusyId(null) }
    );
  };

  // delete
  const deletePost = useDeleteCommunityPost(symbol);
  const deleting = deletePost.isPending;

  const onClickDelete = (p: Post) => {
    if (loading) return;
    if (!isLoggedIn) return toast.error("ログインが必要です。");
    setDeleteTarget(p);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePost.mutateAsync({ post_id: deleteTarget.id });
      toast.success("削除しました。");
      setDeleteTarget(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "削除に失敗しました。";
      toast.error(message);
    }
  };

  // infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      setHydrated(true);
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;

        if (hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root: null, rootMargin: "300px 0px", threshold: 0 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hydrated) {
    return (
      <section className={styles.section} aria-busy="true">
        <header className={styles.header}>
          <h2 className={styles.title}>コミュニティ</h2>
          <button type="button" className={styles.newPostBtn} disabled>
            <PenSquare size={15} />
            投稿する
          </button>
        </header>
        <div className={styles.muted}>投稿を読み込み中...</div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h2 className={styles.title}>コミュニティ</h2>

        {/* ✅ Refresh 대신 New Post */}
        <button
          type="button"
          onClick={onClickNewPost}
          className={styles.newPostBtn}
        >
          <PenSquare size={15} />
          投稿する
        </button>

      </header>

      {isLoading && <div className={styles.muted}>投稿を読み込み中...</div>}
      {isError && <div className={styles.error}>{error?.message ?? "投稿の取得に失敗しました。"}</div>}

      {!isLoading && !isError && posts.length === 0 && (
        <div className={styles.muted}>まだ投稿はありません。</div>
      )}

      {!isLoading && !isError && posts.length > 0 && (
        <div className={styles.list}>
          {posts.map((p) => (
            <PostItem 
              key={p.id}
              post={p}
              editableByMe={p.editable_by_me}
              onEdit={() => setEditTarget(p)}
              onDelete={() => onClickDelete(p)}
              onLike={() => onLike(p.id, p.liked_by_me)}
              likeLoading={toggleLike.isPending && likeBusyId === p.id}
            />
          ))}
        </div>
      )}

      {/* ✅ sentinel */}
      {!isLoading && !isError && <div ref={sentinelRef} style={{ height: 1 }} />}

      {/* ✅ 상태 표시 */}
      {!isLoading && !isError && (
        <div className={styles.meta}>
          {isFetchingNextPage ? "さらに読み込み中..." : hasNextPage ? "下にスクロールして続きを表示" : "すべて表示しました"}
        </div>
      )}

      {/* ✅ Modal */}
      {isModalOpen && (
        <NewPostModal
          symbol={symbol}
          onClose={() => setIsModalOpen(false)}
          // onSubmit={...} // 나중에 API 붙일 때 여기로 연결하면 깔끔
        />
      )}
      {editTarget && (
        <EditPostModal
          symbol={symbol}
          post={editTarget}
          onClose={() => setEditTarget(null)}
          onUpdated={() => {
            // 필요하면 추가 작업
          }}
        />
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="投稿を削除"
        message={`この投稿を削除しますか？`}
        confirmText="削除する"
        cancelText="キャンセル"
        danger
        loading={deleting}
        onClose={() => {
          if (deleting) return;
          setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
