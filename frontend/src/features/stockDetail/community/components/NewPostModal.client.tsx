"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./NewPostModal.module.css";
import { toast } from "sonner";
import { useCreateCommunityPost } from "../hooks/useCreateCommunityPost";
import { uploadPostImage } from "../api/uploadApi.client";
import { Image as ImageIcon, RefreshCcw, Trash2 } from "lucide-react";

export default function NewPostModal({
  symbol,
  onClose,
}: {
  symbol: string;
  onClose: () => void;
}) {
  const [body, setBody] = useState("");

  // image
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const createPost = useCreateCommunityPost(symbol);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ESC to close (アップロード中は閉じない)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (uploading) return;
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, uploading]);

  // focus textarea on open
  useEffect(() => {
    dialogRef.current?.querySelector("textarea")?.focus();
  }, []);

  const resetFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pickImage = () => {
    if (uploading || createPost.isPending) return;
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

    // 選択を即反映
    setFile(f);
    setImageUrl(null);

    // upload
    setUploading(true);
    try {
      const { publicUrl } = await uploadPostImage(f);
      setImageUrl(publicUrl);
      toast.success("画像をアップロードしました。");
    } catch (e: any) {
      toast.error(e?.message ?? "画像のアップロードに失敗しました。");
      setFile(null);
      setImageUrl(null);
      resetFileInput();
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!body.trim()) return;
    if (uploading) return;

    if (file && !imageUrl) {
      toast.error("画像のアップロードが完了していません。");
      return;
    }

    try {
      await createPost.mutateAsync({
        body,
        imageUrl,
      });

      toast.success("投稿しました。");
      setBody("");
      removeImage();
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "投稿に失敗しました。");
    }
  };

  const submitDisabled =
    !body.trim() ||
    createPost.isPending ||
    uploading ||
    (file !== null && !imageUrl);

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          if (uploading) return;
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
        aria-label="新規投稿"
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.title}>新規投稿</div>
            <div className={styles.subtitle}>銘柄: {symbol}</div>
          </div>

          <button
            className={styles.closeBtn}
            onClick={() => {
              if (uploading) return;
              onClose();
            }}
            aria-label="閉じる"
            disabled={uploading}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>

          <textarea
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="いま何を考えていますか？"
            rows={6}
            disabled={createPost.isPending || uploading}
          />

          {/* image controls */}
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
              disabled={createPost.isPending || uploading}
              aria-label={file ? "画像を変更" : "画像を追加"}
              title={file ? "画像を変更" : "画像を追加"}
            >
              {file ? <RefreshCcw size={18} /> : <ImageIcon size={18} />}
            </button>

            {file && (
              <button
                type="button"
                className={styles.imageIconBtnDanger}
                onClick={removeImage}
                disabled={createPost.isPending || uploading}
                aria-label="画像を削除"
                title="画像を削除"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>

          {/* preview */}
          {previewUrl && (
            <div className={styles.previewBox}>
              <div className={styles.previewInner}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="画像プレビュー" className={styles.previewImg} />

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
                if (uploading) return;
                onClose();
              }}
              disabled={createPost.isPending || uploading}
            >
              キャンセル
            </button>

            <button
              className={styles.submitBtn}
              onClick={onSubmit}
              disabled={submitDisabled}
            >
              {createPost.isPending ? "投稿中…" : "投稿する"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}