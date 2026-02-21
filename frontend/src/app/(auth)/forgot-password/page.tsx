import type { Metadata } from "next";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "パスワード再設定",
  description: "パスワード再設定メールを送信します。",
  alternates: {
    canonical: "/forgot-password",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <ForgotPasswordClient />;
}
