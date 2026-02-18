"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import PasswordField from "@/app/components/common/PasswordField";
import { resetPasswordApi } from "@/features/auth/api";

import styles from "./page.module.css";

type ApiError = Error & { status?: number; data?: { error?: string; errors?: string[] } };

export default function ResetPasswordClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!token) {
      setErrorMsg("無効なリンクです。メールから再度アクセスしてください。");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMsg("パスワード確認が一致しません。");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordApi({
        token,
        password,
        password_confirmation: passwordConfirm,
      });
      setSuccessMsg("パスワードを更新しました。新しいパスワードでログインしてください。");
      setPassword("");
      setPasswordConfirm("");
    } catch (error: unknown) {
      const err = error as ApiError;
      const firstError = err?.data?.errors?.[0] ?? err?.data?.error;
      setErrorMsg(firstError || "パスワード更新に失敗しました。時間をおいて再試行してください。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.Page}>
      <div className={styles.Container}>
        <h1 className={styles.Title}>新しいパスワード設定</h1>
        <p className={styles.Subtitle}>メールのリンク経由でアクセスした場合のみ更新できます。</p>

        {!token && <p className={styles.Error}>トークンが見つかりません。</p>}
        {errorMsg && <p className={styles.Error}>{errorMsg}</p>}
        {successMsg && <p className={styles.Success}>{successMsg}</p>}

        <form className={styles.Form} onSubmit={handleSubmit}>
          <PasswordField
            label="新しいパスワード"
            name="password"
            placeholder="新しいパスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            disabled={loading || !!successMsg}
          />

          <PasswordField
            label="新しいパスワード確認"
            name="password_confirmation"
            placeholder="新しいパスワードを再入力"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            disabled={loading || !!successMsg}
          />

          <button className={styles.PrimaryButton} type="submit" disabled={loading || !token || !!successMsg}>
            {loading ? "Updating..." : "パスワードを更新"}
          </button>

          <div className={styles.Footer}>
            <Link href="/login" className={styles.Link}>
              ログインへ移動
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
