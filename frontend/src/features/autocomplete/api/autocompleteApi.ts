// src/features/autocomplete/api/autocompleteApi.ts
import { apiFetch } from "@/lib/apiClient";
import type { AutocompleteParams, AutocompleteResponse } from "./types";

export function getAutocomplete(params: AutocompleteParams) {
  const qs = new URLSearchParams();
  qs.set("q", params.q);
  qs.set("provider", params.provider);

  return apiFetch<AutocompleteResponse>(`/api/autocomplete?${qs.toString()}`, {
    method: "GET",
  });
}