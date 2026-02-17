// src/features/autocomplete/ui/format.ts
// src/features/autocomplete/ui/format.ts
import type { AutocompleteItem } from "../api/types";

export function displayNameOf(it: AutocompleteItem) {
  // ✅ 일본어 UI니까 JP -> EN -> SYMBOL
  return it.name_jp || it.name_en || it.symbol;
}

export function secondaryTextOf(it: AutocompleteItem) {
  // 예) "TSE / EQUITY" or "NASDAQ / ETF"
  const parts = [it.exchange, it.security_type].filter(Boolean) as string[];
  return parts.join(" / ");
}