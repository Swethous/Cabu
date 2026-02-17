"use client";

import { useEffect, useRef } from "react";
import styles from "./ConfirmModal.module.css";

type Props = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;

  onConfirm: () => void | Promise<void>;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title = "確認",
  message,
  confirmText = "削除する",
  cancelText = "キャンセル",
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (loading) return;
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, loading]);

  if (!open) return null;

  return (
    <div
      className={styles.backdrop}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          if (loading) return;
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialogRef}
      >
        <header className={styles.header}>
          <div className={styles.title}>{title}</div>
          <button
            className={styles.closeBtn}
            onClick={() => {
              if (loading) return;
              onClose();
            }}
            aria-label="閉じる"
            disabled={loading}
          >
            ×
          </button>
        </header>

        <div className={styles.body}>
          <p className={styles.message}>{message}</p>

          <div className={styles.actions}>
            <button
              className={styles.cancelBtn}
              onClick={() => {
                if (loading) return;
                onClose();
              }}
              disabled={loading}
            >
              {cancelText}
            </button>

            <button
              className={`${styles.confirmBtn} ${danger ? styles.danger : ""}`}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "処理中…" : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}