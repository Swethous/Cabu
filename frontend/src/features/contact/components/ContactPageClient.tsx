"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Check, ChevronDown, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  createContactInquiry,
  type ContactCategory,
} from "@/features/contact/api/contactApi.client";
import styles from "./ContactPageClient.module.css";

const CATEGORIES: Array<{ value: ContactCategory; label: string }> = [
  { value: "bug_report", label: "バグ報告" },
  { value: "feature_request", label: "機能要望" },
  { value: "account", label: "アカウント" },
  { value: "other", label: "その他" },
];

export default function ContactPageClient() {
  const router = useRouter();
  const { user, isLoggedIn, loading } = useAuth();

  const [category, setCategory] = useState<ContactCategory>("other");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const categoryWrapRef = useRef<HTMLDivElement | null>(null);

  const replyEmail = useMemo(() => user?.email ?? "", [user?.email]);
  const categoryLabel = useMemo(
    () => CATEGORIES.find((c) => c.value === category)?.label ?? "その他",
    [category]
  );

  useEffect(() => {
    if (!categoryOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      const el = categoryWrapRef.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) setCategoryOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCategoryOpen(false);
    };

    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [categoryOpen]);

  const submitMutation = useMutation({
    mutationFn: createContactInquiry,
    onSuccess: () => {
      toast.success("お問い合わせを送信しました。");
      setCategory("other");
      setSubject("");
      setBody("");
    },
    onError: (e: unknown) => {
      const message = e instanceof Error ? e.message : "送信に失敗しました。";
      toast.error(message);
    },
  });

  const onSubmit = async () => {
    if (!subject.trim()) {
      toast.error("件名を入力してください。");
      return;
    }
    if (!body.trim()) {
      toast.error("内容を入力してください。");
      return;
    }

    await submitMutation.mutateAsync({
      category,
      subject,
      body,
    });
  };

  if (loading) {
    return <div className={styles.state}>読み込み中...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.wrap}>
        <section className={styles.gate}>
          <h1 className={styles.title}>お問い合わせ</h1>
          <p className={styles.gateText}>お問い合わせの送信にはログインが必要です。</p>

          <div className={styles.gateActions}>
            <button type="button" className={styles.primaryBtn} onClick={() => router.push("/login")}>
              ログインへ
            </button>
            <Link href="/" className={styles.secondaryLink}>
              ホームへ戻る
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <section className={styles.panel}>
        <header className={styles.header}>
          <h1 className={styles.title}>お問い合わせ</h1>
          <p className={styles.subtitle}>通常1〜2営業日以内に返信します。</p>
        </header>

        <div className={styles.form}>
          <div className={styles.field}>
            <span id="contact-category-label" className={styles.label}>カテゴリ</span>
            <div className={styles.selectWrap} ref={categoryWrapRef}>
              <button
                type="button"
                className={styles.selectTrigger}
                onClick={() => {
                  if (submitMutation.isPending) return;
                  setCategoryOpen((v) => !v);
                }}
                disabled={submitMutation.isPending}
                aria-haspopup="listbox"
                aria-expanded={categoryOpen}
                aria-labelledby="contact-category-label"
              >
                <span className={styles.selectValue}>{categoryLabel}</span>
                <ChevronDown
                  size={16}
                  className={`${styles.selectIcon} ${categoryOpen ? styles.selectIconOpen : ""}`}
                  aria-hidden="true"
                />
              </button>

              {categoryOpen && (
                <div className={styles.dropdown} role="listbox" aria-label="カテゴリ選択">
                  {CATEGORIES.map((c) => {
                    const active = c.value === category;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        className={`${styles.option} ${active ? styles.optionActive : ""}`}
                        onClick={() => {
                          setCategory(c.value);
                          setCategoryOpen(false);
                        }}
                      >
                        <span>{c.label}</span>
                        {active && <Check size={14} className={styles.optionCheck} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <label className={styles.field}>
            <span className={styles.label}>返信先メール</span>
            <input className={styles.input} value={replyEmail} readOnly />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>件名</span>
            <input
              className={styles.input}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              placeholder="件名を入力してください"
              disabled={submitMutation.isPending}
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>内容</span>
            <textarea
              className={styles.textarea}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={5000}
              rows={8}
              placeholder="お問い合わせ内容を入力してください"
              disabled={submitMutation.isPending}
            />
          </label>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={onSubmit}
            disabled={submitMutation.isPending}
          >
            <Send size={14} />
            {submitMutation.isPending ? "送信中..." : "送信する"}
          </button>
        </div>
      </section>
    </div>
  );
}
