// src/app/my/page.tsx
import type { Metadata } from "next";
import MyPageClient from "@/features/mypage/components/MyPageClient";

export const metadata: Metadata = {
  title: "マイページ",
  description: "プロフィールと投稿履歴を確認できます。",
  alternates: {
    canonical: "/my",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MyPage() {
  return <MyPageClient />;
}
