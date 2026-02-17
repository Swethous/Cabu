"use client";

import type { FC } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import {
  Bookmark,
  CircleUserRound,
  Mail,
  X,
  ChevronRight,
} from "lucide-react";
import styles from "./ProfileDrawer.module.css";

import { useAuth } from "@/contexts/AuthContext";

type ProfileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
};

const ProfileDrawer: FC<ProfileDrawerProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, isLoggedIn, logout, loading } = useAuth();

  const drawerRef = useRef<HTMLElement | null>(null);

  // ✅ inert를 JSX로 쓰지 않고, DOM attribute로 직접 토글 (TS 타입 에러 없음)
  useEffect(() => {
    const el = drawerRef.current;
    if (!el) return;

    if (isOpen) {
      el.removeAttribute("inert");
    } else {
      el.setAttribute("inert", "");
    }
  }, [isOpen]);

  // ✅ 닫기 직전에 포커스가 드로어 내부면 밖으로 빼기 (aria-hidden 경고 방지)
  const safeClose = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    const drawer = drawerRef.current;

    if (drawer && active && drawer.contains(active)) {
      active.blur();
      // 가능하면 "드로어 열기 버튼"으로 focus 복귀가 베스트지만,
      // 여기서는 트리거 ref가 없으니 blur로 처리.
    }

    onClose();
  }, [onClose]);

  // ✅ 부모 상태 변화로 갑자기 닫혀도(라우팅 등) 포커스 정리
  useEffect(() => {
    if (!isOpen) {
      const active = document.activeElement as HTMLElement | null;
      const drawer = drawerRef.current;
      if (drawer && active && drawer.contains(active)) active.blur();
    }
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout(); // ✅ BFF logout 호출 + user null 처리
      safeClose();
      router.push("/login");
    } catch (e) {
      console.error("logout fail", e);
    }
  };

  const goLogin = () => {
    safeClose();
    router.push("/login");
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`${styles.ProfileDrawer__overlay} ${
          isOpen ? styles["is-open"] : ""
        }`}
        onClick={safeClose}
        aria-hidden="true"
      />

      {/* 오른쪽 슬라이드 패널 */}
      <aside
        ref={drawerRef}
        className={`${styles.ProfileDrawer} ${isOpen ? styles["is-open"] : ""}`}
        aria-hidden={!isOpen}
      >
        <div className={styles.ProfileDrawer__header}>
          <h2>プロフィール</h2>
          <button
            type="button"
            className={styles.ProfileDrawer__closeButton}
            onClick={safeClose}
            aria-label="閉じる"
          >
            <X size={18} />
          </button>
        </div>

        {/* 유저 정보 */}
        <div className={styles.ProfileDrawer__user}>
          <div className={styles.ProfileDrawer__avatar}>
            <span>{user?.name?.charAt(0) ?? "U"}</span>
          </div>

          <div className={styles.ProfileDrawer__userInfo}>
            <div className={styles.ProfileDrawer__name}>
              {loading ? "Loading..." : user?.name ?? "ゲスト"}
            </div>
            <div className={styles.ProfileDrawer__email}>
              {loading ? "" : user?.email ?? ""}
            </div>
          </div>
        </div>

        <nav className={styles.ProfileDrawer__menu}>
          {isLoggedIn && (
            <>
              <Link href="/my" className={styles.ProfileDrawer__item} onClick={safeClose}>
                <CircleUserRound size={18} className={styles.ProfileDrawer__itemIcon} />
                <span>マイページ</span>
                <ChevronRight size={16} className={styles.ProfileDrawer__itemArrow} />
              </Link>

              <Link
                href="/bookmarks"
                className={styles.ProfileDrawer__item}
                onClick={safeClose}
              >
                <Bookmark size={18} className={styles.ProfileDrawer__itemIcon} />
                <span>ブックマーク</span>
                <ChevronRight size={16} className={styles.ProfileDrawer__itemArrow} />
              </Link>
            </>
          )}

          <Link href="/contact" className={styles.ProfileDrawer__item} onClick={safeClose}>
            <Mail size={18} className={styles.ProfileDrawer__itemIcon} />
            <span>お問い合わせ</span>
            <ChevronRight size={16} className={styles.ProfileDrawer__itemArrow} />
          </Link>
        </nav>

        <div className={styles.ProfileDrawer__footer}>
          {isLoggedIn ? (
            <button
              type="button"
              className={styles.ProfileDrawer__logoutButton}
              onClick={handleLogout}
              disabled={loading}
            >
              ログアウト
            </button>
          ) : (
            <button
              type="button"
              className={styles.ProfileDrawer__logoutButton}
              onClick={goLogin}
            >
              ログイン
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default ProfileDrawer;
