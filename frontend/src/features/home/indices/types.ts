export type IndexPoint = {
  time: string | number;
  close: number;
};

// Rails API 원본 (sparklines)
export type IndexApiItem = {
  id: number | string;
  yahoo_symbol: string;
  name: string;     // 영문
  name_jp: string;  // 일본어/한글(너 API 필드명 유지)
  points: IndexPoint[];
};

// UI에서 바로 쓰는 “완성형”
export type IndexItem = {
  id: string;
  symbol: string;
  nameEn: string;
  nameJa: string; //
  currency: "USD" | "JPY";
  price: number;
  change: number;
  changePercent: number;
  points: IndexPoint[];
};