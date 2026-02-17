"use client";

import type { FC } from "react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LogIn, Search } from "lucide-react";

import styles from "./Header.module.css";
import { useAuth } from "@/contexts/AuthContext";

import LogoIcon from "@/assets/icons/logo.png";
import MenuIcon from "@/assets/icons/menu.png";

import SearchModal, {
  type AutocompleteSelectItem,
} from "@/features/autocomplete/components/SearchModal";

type HeaderProps = {
  onMenuClick?: () => void;
};

const Header: FC<HeaderProps> = ({ onMenuClick }) => {
  const router = useRouter(); // 이거 추가
  const { isLoggedIn, loading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSelect = (it: AutocompleteSelectItem) => {
    setSearchOpen(false); // 선택하면 모달 닫기
    router.push(`/stocks/${encodeURIComponent(it.symbol)}`, { scroll: true });
  };

  return (
    <>
      <header className={styles.Header}>
        <div className={styles.Header__left}>
          <Link className={styles.Header__brandButton} href="/" aria-label="홈으로 이동">
            <Image
              src={LogoIcon}
              alt="Cabu Logo"
              width={101}
              height={40}
              className={styles.Header__logo}
              priority
            />
          </Link>
        </div>

        <div className={styles.Header__right}>
          <button
            type="button"
            className={styles.Header__iconButton}
            aria-label="검색"
            onClick={() => setSearchOpen(true)}
          >
            <Search size={20} strokeWidth={2.2} className={styles.Header__iconSvg} />
          </button>

          {loading ? null : isLoggedIn ? (
            <button
              type="button"
              className={styles.Header__iconButton}
              aria-label="메뉴 열기"
              onClick={onMenuClick}
            >
              <Image
                src={MenuIcon}
                alt="메뉴"
                width={20}
                height={20}
                className={styles.Header__iconImage}
              />
            </button>
          ) : (
            <button
              type="button"
              className={styles.Header__iconButton}
              aria-label="로그인"
              onClick={() => router.push("/login")}
            >
              <LogIn size={20} strokeWidth={2.2} className={styles.Header__iconSvg} />
            </button>
          )}
        </div>
      </header>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleSelect} />
    </>
  );
};

export default Header;
