"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import InputField from "@/app/components/common/InputField";
import PasswordField from "@/app/components/common/PasswordField";
import { registerApi } from "@/features/auth/api";
import GoogleIcon from "@/assets/icons/google.png";

import styles from "./page.module.css";

type ApiError = Error & { status?: number; data?: { errors?: string[] } };

export default function RegisterClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();

  const handleGoogleSignup = () => {
    window.location.href = "/api/auth/google/start";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await registerApi({
        name,
        email,
        password,
        password_confirmation: passwordConfirm,
      });

      // 리액트 버전처럼 회원가입 성공하면 로그인 페이지로
      router.push("/login");
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error("register fail", err);

      const errors = err?.data?.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        setErrorMsg(errors[0]);
      } else if (err?.status === 422) {
        setErrorMsg("入力内容を確認してください。");
      } else {
        setErrorMsg("登録に失敗しました。しばらくしてからお試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.RegisterPage}>
      <div className={styles.RegisterPage__container}>
        <h1 className={styles.RegisterPage__title}>アカウント作成</h1>
        <p className={styles.RegisterPage__subtitle}>
          株式コミュニティに参加しよう！
        </p>

        {errorMsg && <p className={styles.RegisterPage__error}>{errorMsg}</p>}

        <form
          className={styles.RegisterForm}
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <InputField
            label="ユーザー名"
            name="name"
            placeholder="ユーザー名を入力"
            value={name}
            autoComplete="name"
            onChange={(e) => setName(e.target.value)}
          />

          <InputField
            label="メールアドレス"
            type="email"
            name="email"
            placeholder="example@gmail.com"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
          />

          <PasswordField
            label="パスワード"
            name="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />

          <PasswordField
            label="パスワード確認"
            name="password_confirmation"
            placeholder="パスワードを確認"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
          />

          <button className={styles.PrimaryButton} type="submit" disabled={loading}>
            {loading ? "Creating..." : "新規登録"}
          </button>

          <div className={styles.Divider}>
            <span>または</span>
          </div>

          <button
            className={styles.GoogleButton}
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
          >
            <Image
              src={GoogleIcon}
              alt="Google"
              width={18}
              height={18}
              className={styles.GoogleIcon}
            />
            Googleで登録
          </button>

          <div className={styles.FormFooter}>
            すでにアカウントをお持ちの方？
            <Link href="/login" className={`${styles.FormLink} ${styles.Strong}`}>
              ログイン
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
