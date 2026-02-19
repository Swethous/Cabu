// src/features/mypage/components/ProfileEditModal.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./ProfileEditModal.module.css";
import { MyProfile } from "../types";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { uploadAvatarImage } from "../api/uploadAvatarImage.client";
import { toast } from "sonner";
import { X, Image as ImageIcon, RefreshCcw, Trash2 } from "lucide-react";

const DEFAULT_AVATAR_OPTIONS = Array.from(
  { length: 8 },
  (_, i) => `/avatars/avatar_${String(i + 1).padStart(2, "0")}.png`
);

const normalizeAvatarPath = (url: string) => {
  try {
    return new URL(url, "http://localhost").pathname;
  } catch {
    return url;
  }
};

export default function ProfileEditModal({
  profile,
  onClose,
}: {
  profile: MyProfile;
  onClose: () => void;
}) {
  const [name, setName] = useState(profile.name);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");

  // local file (for instant preview before upload finishes)
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const updateMutation = useUpdateProfile();

  const previewUrl = useMemo(() => {
    if (!file) return avatarUrl;
    return URL.createObjectURL(file);
  }, [file, avatarUrl]);

  useEffect(() => {
    // revoke object url
    return () => {
      if (file && previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [file, previewUrl]);

  // ESC to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (uploading || updateMutation.isPending) return;
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, uploading, updateMutation.isPending]);

  const pickImage = () => {
    if (uploading || updateMutation.isPending) return;
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    if (uploading || updateMutation.isPending) return;
    setFile(null);
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const selectDefaultAvatar = (url: string) => {
    if (uploading || updateMutation.isPending) return;
    setFile(null);
    setAvatarUrl(url);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSelectFile = async (f: File | null) => {
    if (!f) return;

    if (!f.type.startsWith("image/")) {
      toast.error("画像ファイルのみ選択できます。");
      return;
    }

    // show instant preview
    setFile(f);
    setUploading(true);

    try {
      // ✅ postと同じ：先にアップロード(Next 업로드 API) -> publicUrl確保
      const { publicUrl } = await uploadAvatarImage(f);

      // アップロードが成功したらURLに差し替え
      setAvatarUrl(publicUrl);
      setFile(null);
      toast.success("画像をアップロードしました。");
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "画像のアップロードに失敗しました。";
      toast.error(message);
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("名前を入力してください。");
      return;
    }
    if (uploading) {
      toast.error("画像をアップロード中です。");
      return;
    }

    try {
      // ✅ postと同じ：クライアント -> Next(BFF) に camelCase で送る
      await updateMutation.mutateAsync({
        name: name.trim(),
        avatarUrl: avatarUrl.trim() || null,
      });

      toast.success("プロフィールを更新しました。");
      onClose();
    } catch (err) {
      console.error("Failed to update profile:", err);
      toast.error("プロフィールの更新に失敗しました。");
    }
  };

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (uploading || updateMutation.isPending) return;
        onClose();
      }}
    >
      <div className={styles.modal} role="dialog" aria-modal="true">
        <header className={styles.header}>
          <div className={styles.title}>プロフィール編集</div>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
            disabled={uploading || updateMutation.isPending}
          >
            <X size={18} />
          </button>
        </header>

        <div className={styles.body}>
          <div className={styles.formGroup}>
            <label className={styles.label}>名前</label>
            <input
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="名前を入力してください"
              disabled={uploading || updateMutation.isPending}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>プロフィール写真</label>

            <div className={styles.previewArea}>
              <div className={styles.previewInner}>
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className={styles.avatarPreview}
                    referrerPolicy="no-referrer"
                    onError={() => {
                      if (!file) setAvatarUrl("");
                    }}
                  />
                ) : (
                  <div
                    className={styles.avatarPreview}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#9ca3af",
                      fontSize: "24px",
                      fontWeight: 700,
                    }}
                  >
                    {name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}

                {uploading && (
                  <div className={styles.uploadOverlay}>
                    <div className={styles.spinner} />
                  </div>
                )}
              </div>
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
                disabled={uploading || updateMutation.isPending}
                title="写真を変更"
              >
                {previewUrl ? <RefreshCcw size={18} /> : <ImageIcon size={18} />}
              </button>

              {previewUrl && (
                <button
                  type="button"
                  className={styles.imageIconBtnDanger}
                  onClick={removeImage}
                  disabled={uploading || updateMutation.isPending}
                  title="写真を削除"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>

            <div className={styles.defaultAvatarSection}>
              <div className={styles.defaultAvatarTitle}>基本アバターを選択</div>
              <div className={styles.avatarGrid}>
                {DEFAULT_AVATAR_OPTIONS.map((src) => {
                  const selected = normalizeAvatarPath(avatarUrl) === src;
                  return (
                    <button
                      key={src}
                      type="button"
                      className={`${styles.avatarOption} ${selected ? styles.avatarOptionSelected : ""}`}
                      onClick={() => selectDefaultAvatar(src)}
                      disabled={uploading || updateMutation.isPending}
                      aria-pressed={selected}
                      aria-label={`基本アバター ${src}`}
                    >
                      <img src={src} alt="" className={styles.avatarOptionImg} />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={uploading || updateMutation.isPending}
          >
            キャンセル
          </button>
          <button
            className={styles.submitBtn}
            onClick={handleSave}
            disabled={uploading || updateMutation.isPending || !name.trim()}
          >
            {updateMutation.isPending ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
