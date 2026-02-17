// src/features/autocomplete/api/types.ts
export type InstrumentProvider = "JPX" | "NASDAQ_LISTED";

export type InstrumentSecurityType =
  | "EQUITY"
  | "ETF"
  | "REIT"
  | "PS"
  | "OTHER";

export type AutocompleteItem = {
  id: number;
  provider: InstrumentProvider;
  symbol: string;

  name_en: string | null;
  name_jp: string | null;

  exchange: string | null;
  security_type: InstrumentSecurityType | null;
  jpx_section: string | null;
};

export type AutocompleteResponse = {
  items: AutocompleteItem[];
};

export type AutocompleteParams = {
  q: string;
  provider: InstrumentProvider; // ✅ 이제 항상 필수
};