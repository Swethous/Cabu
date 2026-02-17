// PostItem.client.tsx (또는 PostItem.tsx)
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import styles from "./PostItem.module.css";
import type { Post } from "../types";
import { Heart, MessageCircle } from "lucide-react";
import CommentsPanel from "./CommentPanel.client";

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
  post: Post;
  onLike?: () => void;
  likeLoading?: boolean;

  editableByMe?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export default function PostItem({
  post,
  onLike,
  likeLoading = false,
  editableByMe,
  onEdit,
  onDelete,
}: Props) {
  const name = post.user?.name ?? "Unknown";
  const avatar = post.user?.avatar_url;

  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);

  const timeAgo = useMemo(() => formatTimeAgoJa(post.created_at, nowMs), [post.created_at, nowMs]);

  const [menuOpen, setMenuOpen] = useState(false);

  // image modal
  const [imageOpen, setImageOpen] = useState(false);
  useEffect(() => {
    if (!imageOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setImageOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [imageOpen]);

  const [commentsOpen, setCommentsOpen] = useState(false);

  useEffect(() => {
    const update = () => setNowMs(Date.now());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;

    if (expanded) {
      setCanExpand(true);
      return;
    }
    const isOverflowing = el.scrollHeight - el.clientHeight > 1;
    setCanExpand(isOverflowing);
  }, [post.body, expanded]);

  // ✅ 메뉴 바깥 클릭 시 닫기(통일감 + UX)
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

  return (
    <article className={styles.card}>
      <div className={styles.grid}>
        {/* LEFT */}
        <div className={styles.avatarCol}>
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.avatar} src={avatar} alt={`${name}'s avatar`} />
          ) : (
            <div className={styles.avatarFallback} aria-hidden="true">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className={styles.contentCol}>
          <div className={styles.nameBlock}>
            <div className={styles.nameRow}>
              <div className={styles.nameText}>
                <div className={styles.userName}>{name}</div>
                <time className={styles.time} dateTime={post.created_at} suppressHydrationWarning>
                  {timeAgo}
                </time>
              </div>

              {editableByMe && (
                <div className={styles.kebabWrap}>
                  <button
                    type="button"
                    className={styles.kebabBtn}
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="メニュー"
                  >
                    ⋯
                  </button>

                  {menuOpen && (
                    <div className={styles.kebabMenu} role="menu">
                      <button
                        type="button"
                        className={styles.kebabItem}
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          onEdit?.();
                        }}
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
          </div>

          {/* body */}
          <div
            ref={bodyRef}
            className={`${styles.body} ${expanded ? styles.bodyExpanded : styles.bodyClamped}`}
          >
            {post.body}
          </div>

          {canExpand && (
            <button
              type="button"
              className={styles.moreBtn}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "閉じる" : "もっと見る"}
            </button>
          )}

          {/* image */}
          {post.image_url && (
            <>
              <button
                type="button"
                className={styles.imageBtn}
                onClick={() => setImageOpen(true)}
                aria-label="画像を開く"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.image_url}
                  alt="post image"
                  className={styles.postImage}
                  loading="lazy"
                />
              </button>

              {imageOpen && (
                <div
                  className={styles.imgBackdrop}
                  role="presentation"
                  onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setImageOpen(false);
                  }}
                >
                  <div className={styles.imgModal} role="dialog" aria-modal="true">
                    <button
                      type="button"
                      className={styles.imgClose}
                      onClick={() => setImageOpen(false)}
                      aria-label="閉じる"
                    >
                      ×
                    </button>

                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image_url} alt="full" className={styles.imgFull} draggable={false} />
                  </div>
                </div>
              )}
            </>
          )}

          {/* meta actions (통일된 버튼) */}
          <div className={styles.metaRow}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={onLike}
              disabled={!onLike || likeLoading}
              aria-pressed={post.liked_by_me}
              aria-label="いいね"
              title="いいね"
            >
              <Heart
                size={18}
                className={`${styles.icon} ${post.liked_by_me ? styles.heartOn : ""}`}
              />
              <span className={styles.iconCount}>{post.likes_count}</span>
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              onClick={() => setCommentsOpen((v) => !v)}
              aria-expanded={commentsOpen}
              aria-label="コメント"
              title="コメント"
            >
              <MessageCircle size={18} className={styles.icon} />
              <span className={styles.iconCount}>{post.comments_count}</span>
            </button>
          </div>

          {commentsOpen && (
            <div className={styles.commentsWrap}>
              <CommentsPanel post_id={post.id} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
