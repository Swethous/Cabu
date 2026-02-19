"use client";

import { useMemo, useState } from "react";
import styles from "./CommunityPanel.module.css";

import CommentItem from "./CommentItem.client";
import { useCommunityComments } from "../hooks/useCommunityComments";
import { useCreateCommunityComment } from "../hooks/useCreateCommunityComment";
import { useToggleCommentLike } from "../hooks/useCommentLike";
import { useDeleteCommunityComment } from "../hooks/useDeleteCommunityComment";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ConfirmModal from "./ConfirmModal.client";
import type { Comment } from "../types";

export default function CommentsPanel({ post_id }: { post_id: number }) {
  const [body, setBody] = useState("");
  const { user, isLoggedIn, loading } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);
  const [brokenAvatarUrl, setBrokenAvatarUrl] = useState<string | null>(null);
  const myAvatarUrl = user?.avatar_url;
  const canShowMyAvatar = Boolean(myAvatarUrl) && brokenAvatarUrl !== myAvatarUrl;
  const myInitial = (user?.name?.charAt(0) ?? "U").toUpperCase();

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCommunityComments(post_id);

  const create = useCreateCommunityComment(post_id);

  const comments = useMemo(
    () => data?.pages.flatMap((p) => p.data ?? []) ?? [],
    [data]
  );

  const onSubmit = async () => {
    if (loading) return;
    if (!isLoggedIn) return toast.error("ログインが必要です。");
    const v = body.trim();
    if (!v) return;

    create.mutate(
      { body: v },
      {
        onSuccess: () => setBody(""),
      }
    );
  };

  // comment like
  const toggleLike = useToggleCommentLike(post_id);
  const [likeBusyId, setLikeBusyId] = useState<number | null>(null);

  const onLike = (commentId: number, liked: boolean) => {
    if (loading) return; // 아직 로딩 중
    if (!isLoggedIn) {
      toast.error("ログインが必要です。");
      return;
    }
    if (toggleLike.isPending) return;
    setLikeBusyId(commentId);

    toggleLike.mutate(
      { comment_id: commentId, liked },
      { onSettled: () => setLikeBusyId(null) }
    );
  };

  // comment delete
  const deleteComment = useDeleteCommunityComment(post_id)
  const deleting = deleteComment.isPending;

  const onClickDelete = (c: Comment) => {
    if (loading) return;
    if (!isLoggedIn) return toast.error("ログインが必要です。");
    setDeleteTarget(c);
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteComment.mutateAsync({ comment_id: deleteTarget.id });
      toast.success("削除しました。");
      setDeleteTarget(null);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "削除に失敗しました。";
      toast.error(message);
    }
  };

  return (
    <div className={styles.panel}>
      {/* ✅ 작성폼: 맨 위 */}
    <div className={styles.form}>
      <div className={styles.meCol} aria-hidden="true">
        {canShowMyAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.meAvatar}
            src={myAvatarUrl as string}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBrokenAvatarUrl(myAvatarUrl ?? null)}
          />
        ) : (
          <div className={`${styles.meAvatar} ${styles.meAvatarFallback}`}>{myInitial}</div>
        )}
      </div>

      <div className={styles.formMain}>
        <div className={styles.inputRow}>
          <textarea
            className={styles.textarea}
            placeholder="コメントを書く…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
          />
          <button
            type="button"
            className={styles.submit}
            onClick={onSubmit}
            disabled={create.isPending || !body.trim()}
          >
            送信
          </button>
        </div>
      </div>
    </div>

      {/* ✅ 리스트 */}
      <div className={styles.list}>
        {isLoading && <div className={styles.muted}>Loading comments...</div>}
        {isError && <div className={styles.error}>{error?.message ?? "Failed to load"}</div>}
        {!isLoading && !isError && comments.length === 0 && (
          <div className={styles.muted}>まだコメントがありません。</div>
        )}

        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            editableByMe={c.editable_by_me}
            onDelete={() => onClickDelete(c)}
            onLike={() => onLike(c.id, c.liked_by_me)}
            likeLoading={toggleLike.isPending && likeBusyId === c.id}
          />
        ))}
      </div>

      {/* ✅ 더보기 */}
      {!isLoading && !isError && hasNextPage && (
        <button
          type="button"
          className={styles.more}
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "読み込み中…" : "もっと見る"}
        </button>
      )}
      <ConfirmModal
        open={!!deleteTarget}
        title="コメントを削除"
        message={`このコメントを削除しますか？`}
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
    </div>
    
  );
}
