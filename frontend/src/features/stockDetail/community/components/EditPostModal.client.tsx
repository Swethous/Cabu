"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./EditPostModal.module.css";
import { toast } from "sonner";
import type { Post } from "../types";
import { uploadPostImage } from "../api/uploadApi.client";
import { Image as ImageIcon, RefreshCcw, Trash2 } from "lucide-react";
import { useUpdateCommunityPost } from "../hooks/useUpdateCommunityPost";

const POST_BODY_MAX_LENGTH = 500;

export default function EditPostModal({
  symbol,
  post,
  onClose,
  onUpdated,
}: {
  symbol: string;          // ✅ 추가: invalidate에 필요 (커뮤니티 섹션에서 넘겨줘)
  post: Post;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [body, setBody] = useState(post.body ?? "");

  // image
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(post.image_url ?? null);
  const [uploading, setUploading] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ react-query update hook (invalidate + optimistic 가능)
  const updatePost = useUpdateCommunityPost(symbol);
  const saving = updatePost.isPending;

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ESC close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (uploading || saving) return;
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, uploading, saving]);

  // focus
  useEffect(() => {
    dialogRef.current?.querySelector("textarea")?.focus();
  }, []);

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pickImage = () => {
    if (uploading || saving) return;
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setFile(null);
    setImageUrl(null);
    resetFileInput();
  };

  const onSelectFile = async (f: File | null) => {
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      toast.error("画像ファイルのみ選択できます。");
      resetFileInput();
      return;
    }

    setFile(f);

    setUploading(true);
    try {
      const { publicUrl } = await uploadPostImage(f);
      setImageUrl(publicUrl);
      toast.success("画像をアップロードしました。");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "画像のアップロードに失敗しました。";
      toast.error(message);
      setFile(null);
      resetFileInput();
    } finally {
      setUploading(false);
    }
  };

  const changed =
    body !== (post.body ?? "") ||
    (imageUrl ?? null) !== (post.image_url ?? null);

  const submitDisabled =
    !body.trim() ||
    body.length > POST_BODY_MAX_LENGTH ||
    uploading ||
    saving ||
    !changed;

  const onSubmit = async () => {
    if (submitDisabled) return;
    if (body.length > POST_BODY_MAX_LENGTH) {
      toast.error(`本文は${POST_BODY_MAX_LENGTH}文字以内で入力してください。`);
      return;
    }

    if (file && !imageUrl) {
      toast.error("画像のアップロードが完了していません。");
      return;
    }

    try {
      await updatePost.mutateAsync({
        post_id: post.id,
        body: body.trim(),
        imageUrl, // ✅ camelCase (route handler에서 rails로 감싸서 보냄)
      });

      toast.success("投稿を更新しました。");
      onUpdated?.();
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "更新に失敗しました。";
      toast.error(message);
    }
  };

  const shownImageSrc = previewUrl ?? imageUrl;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          if (uploading || saving) return;
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="投稿を編集"
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.title}>投稿を編集</div>
          </div>

          <button
            className={styles.closeBtn}
            onClick={() => {
              if (uploading || saving) return;
              onClose();
            }}
            aria-label="閉じる"
            disabled={uploading || saving}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <textarea
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="内容を入力…"
            rows={6}
            maxLength={POST_BODY_MAX_LENGTH}
            disabled={saving || uploading}
          />
          <div className={styles.charCount}>
            {body.length}/{POST_BODY_MAX_LENGTH}
          </div>

          <div className={styles.imageRow}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onSelectFile(e.target.files?.[0] ?? null)}
            />

            <button
              type="button"
              className={styles.imageIconBtn}
              onClick={pickImage}
              disabled={saving || uploading}
              aria-label={imageUrl ? "画像を変更" : "画像を追加"}
              title={imageUrl ? "画像を変更" : "画像を追加"}
            >
              {imageUrl ? <RefreshCcw size={18} /> : <ImageIcon size={18} />}
            </button>

            {imageUrl && (
              <button
                type="button"
                className={styles.imageIconBtnDanger}
                onClick={removeImage}
                disabled={saving || uploading}
                aria-label="画像を削除"
                title="画像を削除"
              >
                <Trash2 size={18} />
              </button>
            )}

            {(uploading || saving) && (
              <span className={styles.smallHint}>
                {uploading ? "アップロード中…" : "保存中…"}
              </span>
            )}
          </div>

          {shownImageSrc && (
            <div className={styles.previewBox}>
              <div className={styles.previewInner}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shownImageSrc} alt="画像プレビュー" className={styles.previewImg} />

                {uploading && (
                  <div className={styles.uploadOverlay} aria-live="polite">
                    <div className={styles.spinner} aria-label="アップロード中" />
                    <div className={styles.uploadText}>アップロード中…</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.actions}>
            <button
              className={styles.cancelBtn}
              onClick={() => {
                if (uploading || saving) return;
                onClose();
              }}
              disabled={uploading || saving}
            >
              キャンセル
            </button>

            <button
              className={styles.submitBtn}
              onClick={onSubmit}
              disabled={submitDisabled}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
