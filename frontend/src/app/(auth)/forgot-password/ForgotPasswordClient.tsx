"use client";

import { useState } from "react";
import Link from "next/link";

import InputField from "@/app/components/common/InputField";
import { requestPasswordResetApi } from "@/features/auth/api";

import styles from "./page.module.css";

type ApiError = Error & { status?: number; data?: { error?: string; errors?: string[] } };

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await requestPasswordResetApi({ email });
      setSubmitted(true);
    } catch (error: unknown) {
      const err = error as ApiError;
      const firstError = err?.data?.errors?.[0] ?? err?.data?.error;
      setErrorMsg(firstError || "送信に失敗しました。しばらくしてからお試しください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.Page}>
      <div className={styles.Container}>
        <h1 className={styles.Title}>パスワード再設定</h1>
        <p className={styles.Subtitle}>登録済みメールアドレスに再設定リンクを送信します。</p>

        {errorMsg && <p className={styles.Error}>{errorMsg}</p>}
        {submitted && (
          <p className={styles.Success}>
            メール送信を受け付けました。メール内のリンクから新しいパスワードを設定してください。
          </p>
        )}

        <form className={styles.Form} onSubmit={handleSubmit}>
          <InputField
            label="メールアドレス"
            type="email"
            name="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <button className={styles.PrimaryButton} type="submit" disabled={loading}>
            {loading ? "Sending..." : submitted ? "再設定メールを再送信" : "再設定メールを送信"}
          </button>

          <div className={styles.Footer}>
            <Link href="/login" className={styles.Link}>
              ログインへ戻る
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
