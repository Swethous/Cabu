import { apiFetch } from "@/lib/apiClient";

export type ContactCategory = "bug_report" | "feature_request" | "account" | "other";

type CreateContactRequest = {
  category: ContactCategory;
  subject: string;
  body: string;
};

type CreateContactResponse = {
  id: number;
  message: string;
};

export function createContactInquiry(payload: CreateContactRequest) {
  return apiFetch<CreateContactResponse>("/api/contact", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
