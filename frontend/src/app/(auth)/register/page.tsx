import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "新規登録",
  description: "Cabuの新規アカウントを作成します。",
  alternates: {
    canonical: "/register",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return <RegisterClient />;
}
