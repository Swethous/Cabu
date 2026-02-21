import type { Metadata } from "next";
import HomeClient from "@/features/home/HomeClient";

export const metadata: Metadata = {
  title: "Cabuホーム",
  description: "人気銘柄・急上昇・急下落ランキングをまとめて確認できます。",
  alternates: {
    canonical: "/",
  },
};

export default function HomePage() {
  return (
    <HomeClient />
  );
}
