import type { Metadata } from "next";
import BookmarksPageClient from "@/features/bookmarks/components/BookmarksPageClient";

export const metadata: Metadata = {
  title: "ブックマーク",
  description: "保存した銘柄を一覧で確認できます。",
  alternates: {
    canonical: "/bookmarks",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookmarksPage() {
  return <BookmarksPageClient />;
}
