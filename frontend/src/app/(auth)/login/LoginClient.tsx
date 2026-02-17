"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import PasswordField from "@/app/components/common/PasswordField";
import InputField from "@/app/components/common/InputField";
import { loginApi } from "@/features/auth/api";
import { useAuth } from "@/contexts/AuthContext";
import GoogleIcon from "@/assets/icons/google.png";

import styles from "./page.module.css";

type ApiError = Error & { status?: number };

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const router = useRouter();
  const { setUser } = useAuth(); // 또는 refreshUser

  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google/start";
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const { user } = await loginApi({ email, password }); // ✅ BFF 호출
      setUser(user); // ✅ 헤더/드로어 즉시 반영
      router.push("/");
    } catch (error: unknown) {
      const err = error as ApiError;
      console.error("login failed:", err);

      // fetch 기반: err.status 로 분기
      if (err?.status === 401) {
        setErrorMsg("メールアドレスまたはパスワードが正しくありません。");
      } else {
        setErrorMsg("ログインに失敗しました。しばらくしてからお試しください。");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.LoginPage}>
      <div className={styles.LoginPage__container}>
        <h1 className={styles.LoginPage__title}>ログイン</h1>

        {errorMsg && <p className={styles.LoginPage__error}>{errorMsg}</p>}

        <form className={styles.LoginForm} onSubmit={handleLogin}>
          <InputField
            label="Email"
            type="email"
            name="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <PasswordField
            label="Password"
            name="password"
            placeholder="パスワードを入力"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <div className={styles.FormOptions}>
            <label className={styles.FormCheckbox}>
              <input type="checkbox" />
              <span>ログイン状態を保持する</span>
            </label>

            <Link href="/forgot-password" className={styles.FormLink}>
              パスワードをお忘れですか？
            </Link>
          </div>

          <button className={styles.PrimaryButton} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className={styles.Divider}>
            <span>または</span>
          </div>

          {/* Next에서는 img 대신 Image 권장(급한 건 img도 OK) */}
          <button
            className={styles.GoogleButton}
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <Image
              src={GoogleIcon}
              alt="Google"
              width={18}
              height={18}
              className={styles.GoogleIcon}
            />
            Googleでログイン
          </button>

          <div className={styles.FormFooter}>
            アカウントをお持ちでない方？
            <Link href="/register" className={`${styles.FormLink} ${styles.Strong}`}>
              新規登録
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
