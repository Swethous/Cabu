"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./CommentItem.module.css";
import type { Comment } from "../types";
import { Heart } from "lucide-react";

import { useUpdateCommunityComment } from "../hooks/useUpdateCommunityComment";

const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("ja-JP", { numeric: "auto" });
const ABSOLUTE_TIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Tokyo",
});

function formatTimeAgoJa(iso: string, nowMs: number | null) {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";

  // Keep server/client first render deterministic to prevent hydration mismatch.
  if (nowMs == null) return ABSOLUTE_TIME_FORMATTER.format(t);

  const diffSec = Math.floor((t - nowMs) / 1000);
  const abs = Math.abs(diffSec);

  if (abs < 60) return RELATIVE_TIME_FORMATTER.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60) return RELATIVE_TIME_FORMATTER.format(diffMin, "minute");
  const diffHour = Math.round(diffSec / 3600);
  if (Math.abs(diffHour) < 24) return RELATIVE_TIME_FORMATTER.format(diffHour, "hour");
  const diffDay = Math.round(diffSec / 86400);
  return RELATIVE_TIME_FORMATTER.format(diffDay, "day");
}

type Props = {
  comment: Comment;

  onLike?: () => void;
  likeLoading?: boolean;

  /** ✅ 내 댓글이면 true */
  editableByMe?: boolean;
  onDelete?: () => void;
};

export default function CommentItem({
  comment,
  onLike,
  likeLoading = false,
  editableByMe,
  onDelete,
}: Props) {
  const name = comment.user?.name ?? "Unknown";
  const avatar = comment.user?.avatar_url;
  const [brokenAvatarUrl, setBrokenAvatarUrl] = useState<string | null>(null);
  const canShowAvatar = Boolean(avatar) && brokenAvatarUrl !== avatar;
  const [nowMs, setNowMs] = useState<number | null>(null);
  const timeAgo = useMemo(
    () => formatTimeAgoJa(comment.created_at, nowMs),
    [comment.created_at, nowMs]
  );

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editBody, setEditBody] = useState("");

  const updateMutation = useUpdateCommunityComment(comment.post_id);

  useEffect(() => {
    const update = () => setNowMs(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // ESC 닫기
  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  // ✅ 메뉴 바깥 클릭 시 닫기
  useEffect(() => {
    if (!menuOpen) return;

    const onDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest(`.${styles.kebabWrap}`)) return;
      setMenuOpen(false);
    };

    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const handleEditClick = () => {
    setMenuOpen(false);
    setEditBody(comment.body);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditBody("");
  };

  const handleSave = () => {
    const v = editBody.trim();
    if (!v) return;

    updateMutation.mutate(
      { comment_id: comment.id, body: v },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  return (
    <div className={styles.row}>
      <div className={styles.avatarCol}>
        {canShowAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className={styles.avatar}
            src={avatar as string}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBrokenAvatarUrl(avatar)}
          />
        ) : (
          <div className={styles.avatarFallback} aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </div>
        )}
      </div>

      <div className={styles.main}>
        {/* ✅ left: name+time / right: kebab */}
        <div className={styles.headerRow}>
          <div className={styles.top}>
            <div className={styles.name}>{name}</div>
            <time className={styles.time} dateTime={comment.created_at} suppressHydrationWarning>
              {timeAgo}
            </time>
          </div>

          {!isEditing && editableByMe && (
            <div className={styles.kebabWrap}>
              <button
                type="button"
                className={styles.kebabBtn}
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Comment menu"
              >
                ⋯
              </button>

              {menuOpen && (
                <div className={styles.kebabMenu} role="menu">
                  <button
                    type="button"
                    className={styles.kebabItem}
                    role="menuitem"
                    onClick={handleEditClick}
                  >
                    編集
                  </button>
                  <button
                    type="button"
                    className={`${styles.kebabItem} ${styles.danger}`}
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete?.();
                    }}
                  >
                    削除
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className={styles.editForm}>
            <textarea
              className={styles.editTextarea}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={3}
            />
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                キャンセル
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={updateMutation.isPending || !editBody.trim()}
              >
                {updateMutation.isPending ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.body}>{comment.body}</div>
        )}

        <div className={styles.metaRow}>
          <button
            type="button"
            className={`${styles.iconBtn} ${comment.liked_by_me ? styles.iconBtnOn : ""}`}
            onClick={onLike}
            disabled={!onLike || likeLoading}
            aria-pressed={comment.liked_by_me}
          >
            <Heart
              size={16}
              className={`${styles.icon} ${comment.liked_by_me ? styles.heartOn : ""}`}
              fill={comment.liked_by_me ? "currentColor" : "none"}
            />
            <span className={styles.iconCount}>{comment.likes_count}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
