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
  const { isLoggedIn, loading } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Comment | null>(null);

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
    } catch (e: any) {
      toast.error(e?.message ?? "削除に失敗しました。");
    }
  };

  return (
    <div className={styles.panel}>
      {/* ✅ 작성폼: 맨 위 */}
    <div className={styles.form}>
      <div className={styles.meCol} aria-hidden="true">
        {/* ✅ 이름 없이 "내 아이콘"만 */}
        <div className={styles.meAvatar}>
          {/* 나중에 auth에 user 있으면 avatar_url 넣으면 됨 */}
          {/* 지금은 기본 원형 */}
        </div>
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