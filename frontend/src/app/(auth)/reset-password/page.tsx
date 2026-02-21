import { Suspense } from "react";
import type { Metadata } from "next";
import ResetPasswordClient from "./ResetPasswordClient";

export const metadata: Metadata = {
  title: "新しいパスワード設定",
  description: "パスワード再設定リンクから新しいパスワードを設定します。",
  alternates: {
    canonical: "/reset-password",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
