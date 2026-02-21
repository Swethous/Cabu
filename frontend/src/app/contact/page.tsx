import type { Metadata } from "next";
import ContactPageClient from "@/features/contact/components/ContactPageClient";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "Cabuへのお問い合わせ、バグ報告、機能要望を送信できます。",
  alternates: {
    canonical: "/contact",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
